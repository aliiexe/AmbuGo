"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { LngLatBounds } from "@tomtom-international/web-sdk-maps";
import * as tt from "@tomtom-international/web-sdk-maps";
import * as ttservices from "@tomtom-international/web-sdk-services";
import {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";

interface TrafficLight {
  id: number;
  position: number;
  status: "red" | "yellow" | "green";
  coordinates: [number, number];
  cycleOffset: number; // Added to create randomized cycles
  forceGreen: boolean; // Added to force green when ambulance is near
}

interface MapComponentProps {
  ambulanceProgress: number;
  trafficLights: TrafficLight[]; // Note: Input props won't be used as we're generating lights internally
  className?: string;
}

interface PatientData {
  location: {
    latitude: number;
    longitude: number;
  };
  selectedHospital: {
    hospital_details: {
      latitude: string;
      longitude: string;
    };
  };
}

interface RouteGeoJson extends Feature {
  type: "Feature";
  properties: Record<string, any>;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

interface RouteCollection extends FeatureCollection {
  type: "FeatureCollection";
  features: RouteGeoJson[];
}

interface TrafficFlowData {
  coordinates: [number, number][];
  flowSegmentData: Array<{
    currentSpeed: number;
  }>;
}

interface TrafficResponse {
  flowSegmentData: TrafficFlowData;
}

interface TrafficFlow {
  type: "Feature";
  properties: {
    flow: number; // 0-7 where 0 is no data, 1-2 is free flow, 3-4 is moderate, 5-7 is heavy
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

interface TrafficCollection {
  type: "FeatureCollection";
  features: TrafficFlow[];
}

export default function MapComponent({
  ambulanceProgress,
  className,
}: MapComponentProps) {
  const mapRef = useRef<tt.Map | null>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<tt.Marker[]>([]);
  const [routeData, setRouteData] = useState<RouteCollection | null>(null);
  const [trafficLightsState, setTrafficLightsState] = useState<TrafficLight[]>(
    []
  );
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  async function calculateRoute(
    map: tt.Map,
    start: { lat: number; lon: number },
    end: { lat: number; lon: number }
  ) {
    try {
      const response = await ttservices.services.calculateRoute({
        key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "",
        locations: [
          { lat: start.lat, lng: start.lon },
          { lat: end.lat, lng: end.lon },
        ],
        computeBestOrder: false,
        traffic: true,
        routeType: "fastest",
        travelMode: "car",
      });

      if (response.routes && response.routes.length > 0) {
        const route = response.routes[0];
        const routeGeoJson: RouteGeoJson = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
              coordinates: route.legs.flatMap((leg) =>
              leg.points.map(
                (point) => [point.lng, point.lat] as [number, number]
            )
            ),
          },
        };

        const newRouteData: RouteCollection = {
          type: "FeatureCollection",
          features: [routeGeoJson],
        };
        
        setRouteData(newRouteData);

        // Create traffic lights along the route
        const coordinates = routeGeoJson.geometry.coordinates;
        const numLights = 5; // Number of traffic lights
        const spacing = Math.floor(coordinates.length / (numLights + 1));
        
        // Create traffic lights with random initial states and cycle offsets
        const newTrafficLights: TrafficLight[] = Array.from(
          { length: numLights },
          (_, i) => {
          // Create a random offset (0-5 seconds) for each light to ensure they're not synchronized
          const cycleOffset = Math.floor(Math.random() * 6);
          const statuses = ["red", "yellow", "green"] as const;
          const randomIndex = Math.floor(Math.random() * statuses.length);
          const randomStatus = statuses[randomIndex];
          
          return {
            id: i,
            position: (i + 1) * spacing,
            status: randomStatus,
            coordinates: coordinates[(i + 1) * spacing],
            cycleOffset: cycleOffset,
              forceGreen: false,
          };
          }
        );

        setTrafficLightsState(newTrafficLights);

        // Add route layer
        if (map.getLayer("route")) {
          map.removeLayer("route");
        }
        if (map.getSource("route")) {
          map.removeSource("route");
        }

        map.addSource("route", {
          type: "geojson",
          data: newRouteData,
        });

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#888",
            "line-width": 8,
          },
        });

        // Clear any existing markers (except start, end, and ambulance)
        if (markersRef.current.length > 3) {
          for (let i = 3; i < markersRef.current.length; i++) {
            markersRef.current[i].remove();
          }
          markersRef.current = markersRef.current.slice(0, 3);
        }

        // Add traffic light markers
        newTrafficLights.forEach((light) => {
          const marker = new tt.Marker({
            element: createTrafficLightMarker(light.status),
          })
            .setLngLat(light.coordinates)
            .addTo(map);
          markersRef.current.push(marker);
        });

        // Fit map to route bounds
        const bounds = new LngLatBounds();
        routeGeoJson.geometry.coordinates.forEach((point) => {
          bounds.extend(point as [number, number]);
        });
        map.fitBounds(bounds, { padding: 50 });
        
        // Start the traffic light update cycle
        setLastUpdateTime(Date.now());
      }
    } catch (error) {
      console.error("Error calculating route:", error);
    }
  }

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapElementRef.current || mapRef.current) return;

      if (!process.env.NEXT_PUBLIC_TOMTOM_API_KEY) {
        console.error("TomTom API key is missing");
        return;
      }

      // Get patient data from localStorage
      const patientDataStr = localStorage.getItem("patientData");
      if (!patientDataStr) {
        console.error("No patient data found in localStorage");
        return;
      }

      const patientData: PatientData = JSON.parse(patientDataStr);
      const patientLocation = {
        lat: patientData.location.latitude,
        lon: patientData.location.longitude,
      };
      const hospitalLocation = {
        lat: parseFloat(patientData.selectedHospital.hospital_details.latitude),
        lon: parseFloat(
          patientData.selectedHospital.hospital_details.longitude
        ),
      };

      const map = tt.map({
        key: process.env.NEXT_PUBLIC_TOMTOM_API_KEY,
        container: mapElementRef.current,
        center: [patientLocation.lon, patientLocation.lat],
        zoom: 15,
        style: `https://api.tomtom.com/style/1/style/22.2.1-9?key=${process.env.NEXT_PUBLIC_TOMTOM_API_KEY}&map=basic_main`,
        language: "en-GB",
      });

      mapRef.current = map;

      // Add error handling
      map.on("error", (e) => {
        console.error("Map error:", e);
      });

      // Wait for map to load before adding markers and route
      map.on("load", async () => {
        // Add patient location marker
        const patientMarker = new tt.Marker({
          element: createCustomMarker("start"),
        })
          .setLngLat([patientLocation.lon, patientLocation.lat])
          .addTo(map);

        // Add hospital marker
        const hospitalMarker = new tt.Marker({
          element: createCustomMarker("end"),
        })
          .setLngLat([hospitalLocation.lon, hospitalLocation.lat])
          .addTo(map);

        markersRef.current = [patientMarker, hospitalMarker];

        // Create ambulance marker fixed in the center of the map
        const ambulanceMarker = new tt.Marker({
          element: createAmbulanceMarker(),
          anchor: 'center' // Anchor to the center of the element
        })
          .setLngLat(map.getCenter())
          .addTo(map);
        markersRef.current.push(ambulanceMarker);

        // Calculate and display route
        await calculateRoute(map, patientLocation, hospitalLocation);
      });
    };

    initializeMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update traffic lights based on ambulance position
  useEffect(() => {
    if (!mapRef.current || !routeData) return;

    const coordinates = routeData.features[0].geometry.coordinates;
    const totalPoints = coordinates.length;
    
    // Calculate the current index more precisely to ensure smooth movement
    const rawIndex = (ambulanceProgress / 100) * totalPoints;
    const currentIndex = Math.min(Math.floor(rawIndex), totalPoints - 1);
    
    // Get current position precisely on the route path
    const currentPosition = coordinates[currentIndex];
    
    // For smoother movement, interpolate between points when between indices
    let actualPosition = [...currentPosition];
    if (currentIndex < totalPoints - 1 && rawIndex % 1 !== 0) {
      // Calculate position between two points for smoother movement
      const nextPosition = coordinates[currentIndex + 1];
      const fraction = rawIndex % 1;
      actualPosition = [
        currentPosition[0] + (nextPosition[0] - currentPosition[0]) * fraction,
        currentPosition[1] + (nextPosition[1] - currentPosition[1]) * fraction
      ];
    }

    // Center map on the current route position instead of moving ambulance
    if (mapRef.current) {
      // Use flyTo for smooth animation with a very short duration
      mapRef.current.flyTo({
        center: actualPosition as [number, number],
        duration: 50, // Very short duration for smooth updates
        essential: true // This animation is considered essential for the map experience
      });
    }

    // Update traffic lights
    const currentTime = Date.now();
    setLastUpdateTime(currentTime);
        
    // Update traffic lights
    const updatedLights = trafficLightsState.map((light) => {
      // Calculate the position of this light in the route
      const lightPositionIndex = light.position;
      
      // Calculate distance to ambulance - using the actual interpolated position
      const distance = calculateDistance(
        actualPosition[1],
        actualPosition[0],
        light.coordinates[1],
        light.coordinates[0]
      );
      
      // Check if ambulance is approaching this light (within ~300 meters)
      const isApproaching = distance < 0.3 && lightPositionIndex > currentIndex && currentIndex + 30 > lightPositionIndex;
      
      // Check if ambulance has passed this light
      const hasPassed = currentIndex > lightPositionIndex + 10;
      
      let newStatus = light.status;
      let forceGreen = light.forceGreen;
      
      // If ambulance is approaching or is currently at the light, force green
      if (isApproaching || (distance < 0.1 && !hasPassed)) {
        newStatus = "green";
        forceGreen = true;
      } 
      // If ambulance has passed, release the force green and return to normal cycle
      else if (hasPassed && forceGreen) {
        forceGreen = false;
      }
      
      // For all lights, update based on cycle unless forced green
      if (!forceGreen) {
        // Use cycleOffset to create randomized cycling
        const cycleTime = Math.floor((currentTime / 1000 + light.cycleOffset) % 9);
        
        if (cycleTime < 5) {
          newStatus = "red";
        } else if (cycleTime < 6) {
          newStatus = "yellow";
        } else {
          newStatus = "green";
        }
      }
      
      return {
        ...light,
        status: newStatus as "red" | "yellow" | "green",
        forceGreen,
      };
    });
    
    setTrafficLightsState(updatedLights);
    
    // Update traffic light markers
    updatedLights.forEach((light, index) => {
      const markerIndex = index + 3;
      if (markersRef.current[markerIndex]) {
        markersRef.current[markerIndex].getElement().innerHTML = createTrafficLightMarker(
          light.status
        ).innerHTML;
      }
    });

    // Update ambulance marker - no need to move it since it's fixed at center
    const ambulanceMarker = markersRef.current[2]; // Ambulance is the third marker
    if (ambulanceMarker && mapRef.current) {
      // Keep ambulance marker at the center of the map
      ambulanceMarker.setLngLat(mapRef.current.getCenter());
      
      // No rotation needed
    }
  }, [ambulanceProgress, routeData]);

  return (
    <Card className={cn("shadow-md border-0", className)}>
      <CardContent className="p-1">
        <div 
          ref={mapElementRef}
          className="w-full h-[400px] md:h-[500px] rounded-md overflow-hidden"
          aria-label="Route map from patient location to hospital with intelligent traffic light control"
        />
      </CardContent>
    </Card>
  );
}

// Helper functions to create custom markers
function createCustomMarker(type: "start" | "end") {
  const div = document.createElement("div");
  div.className = "custom-marker";
  div.innerHTML =
    type === "start"
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(215.4 16.3% 46.9%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(221.2 83.2% 53.3%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
  return div;
}

function createAmbulanceMarker() {
  const div = document.createElement("div");
  div.className = "ambulance-marker";
  // No transition needed since the ambulance won't move or rotate
  div.innerHTML = `
    <div>
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#3B82F6" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="6" width="18" height="8" rx="2" ry="2"/>
        <rect x="6" y="14" width="12" height="3"/>
        <circle cx="7" cy="17" r="2" fill="black"/>
        <circle cx="17" cy="17" r="2" fill="black"/>
        <rect x="8" y="4" width="8" height="2" fill="#3B82F6"/>
        <path d="M8 9h2v2h2v-2h2" stroke="red" stroke-width="1.5"/>
        <path d="M3 10h3" stroke="red" stroke-width="1"/>
        <path d="M18 10h3" stroke="red" stroke-width="1"/>
        <rect x="3" y="12" width="3" height="1" fill="red"/>
        <rect x="18" y="12" width="3" height="1" fill="red"/>
      </svg>
    </div>
  `;
  return div;
}

function createTrafficLightMarker(status: "red" | "yellow" | "green") {
  const div = document.createElement("div");
  const color =
    status === "red"
    ? "hsl(0 72.2% 50.6%)" 
    : status === "yellow" 
      ? "hsl(45 93.4% 47.5%)" 
      : "hsl(142.1 70.6% 45.3%)";
  
  div.innerHTML = `
    <div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transition: background-color 0.3s ease;
      position: relative;
    ">
      <div style="
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%);
        pointer-events: none;
    "></div>
    </div>
  `;
  return div;
}

// Helper function to calculate bearing between two points
function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const λ1 = toRad(lon1);
  const λ2 = toRad(lon2);

  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  const θ = Math.atan2(y, x);

  return (toDeg(θ) + 360) % 360;
}

// Helper function to calculate distance between two points in kilometers
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
