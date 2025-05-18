"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { getCurrentLocation } from "@/app/utils/location"

// Fix for Leaflet marker icon in Next.js
const icon = L.icon({
  iconUrl: "/map-pin.svg", // Create or use an existing SVG icon
  iconSize: [32, 32],
  iconAnchor: [16, 32],
})

// Define a fallback icon in case the custom one fails

interface LocationMapProps {
  onLocationSelected: (location: { latitude: number; longitude: number }) => void
}

// Component to handle map events
function MapClickHandler({
  onLocationSelected,
  setMarkerPosition,
}: {
  onLocationSelected: (location: { latitude: number; longitude: number }) => void
  setMarkerPosition: (position: [number, number]) => void
}) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      setMarkerPosition([lat, lng])
      onLocationSelected({ latitude: lat, longitude: lng })
    },
  })

  return null
}

export default function LocationMap({ onLocationSelected }: LocationMapProps) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([36.8065, 10.1815]) // Default center (Tunis)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    // Get user's current location to center the map
    const getUserLocation = async () => {
      try {
        const position = await getCurrentLocation()
        setMapCenter([position.latitude, position.longitude])
        
        // Also set initial marker at user's location
        setMarkerPosition([position.latitude, position.longitude])
        onLocationSelected({
          latitude: position.latitude,
          longitude: position.longitude,
        })
      } catch (error) {
        console.error("Error getting location:", error)
        // Keep default location if error
      } finally {
        setIsMapReady(true)
      }
    }

    getUserLocation()
  }, [onLocationSelected])

  // Don't render the map until we have determined the center
  if (!isMapReady) {
    return (
      <div className="h-[400px] bg-slate-100 rounded-lg flex items-center justify-center">
        <p className="text-slate-500">Getting your location...</p>
      </div>
    )
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapClickHandler 
        onLocationSelected={onLocationSelected} 
        setMarkerPosition={setMarkerPosition} 
      />
      
      {markerPosition && (
        <Marker 
          position={markerPosition} 
          icon={icon} 
        />
      )}
    </MapContainer>
  )
} 