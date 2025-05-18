"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, MapPin, Ambulance, Navigation, AlertTriangle } from "lucide-react"
import dynamic from "next/dynamic"

interface TrafficLight {
  id: number
  position: number
  status: "red" | "green"
}

// Dynamically import the Map component to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-[#f8fafc] flex items-center justify-center">
      <div className="animate-pulse text-[#64748b]">Loading map...</div>
    </div>
  ),
})

export default function RouteMap() {
  const router = useRouter()
  const [eta, setEta] = useState("12 minutes")
  const [distance, setDistance] = useState("3.2 km")
  const [ambulanceProgress, setAmbulanceProgress] = useState(0)
  const [trafficLights, setTrafficLights] = useState([
    { id: 1, position: 20, status: "red" },
    { id: 2, position: 40, status: "red" },
    { id: 3, position: 60, status: "red" },
    { id: 4, position: 80, status: "red" },
  ])

  const animationRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate ambulance movement and update traffic lights
  useEffect(() => {
    // Start the animation
    animationRef.current = setInterval(() => {
      setAmbulanceProgress((prev) => {
        const newProgress = prev + 0.5

        // Update ETA based on progress
        const remainingMinutes = Math.max(0, Math.round(12 * (1 - newProgress / 100)))
        setEta(`${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`)

        // Update traffic lights - only change to green once the ambulance passes them
        setTrafficLights((lights) =>
          lights.map((light) => ({
            ...light,
            status: newProgress >= light.position ? "green" : "red",
          })),
        )

        // Stop when we reach the destination
        if (newProgress >= 100) {
          if (animationRef.current) clearInterval(animationRef.current)
          return 100
        }

        return newProgress
      })
    }, 500)

    // Cleanup
    return () => {
      if (animationRef.current) clearInterval(animationRef.current)
    }
  }, [])

  return (
    <div className="min-h-svh bg-[#f8fafc] p-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-6xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-medium text-[#2c3e50]">Route to Hospital</h1>
            <p className="text-[#64748b]">Live navigation to CHU Ibn Rochd Hospital</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push("/ambulance/patient-form")}
            className="border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#334155]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card className="border-0 shadow rounded-xl overflow-hidden">
              <CardHeader className="pb-0 bg-white">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-[#334155] font-medium">Live Route</CardTitle>
                  <Badge variant="outline" className="flex items-center bg-[#f8fafc] text-[#334155] border-[#e2e8f0]">
                    <Clock className="mr-1 h-4 w-4 text-[#2196f3]" />
                    ETA: {eta}
                  </Badge>
                </div>
                <CardDescription className="text-[#64748b]">Casablanca, Morocco</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="w-full h-[500px] rounded-md overflow-hidden border border-[#e2e8f0]">
                  <MapComponent ambulanceProgress={ambulanceProgress} trafficLights={trafficLights as TrafficLight[]} />
                </div>

                {/* Progress bar */}
                <div className="mt-4 relative">
                  <div className="w-full h-2 bg-[#f1f5f9] rounded-full">
                    <div
                      className="h-2 bg-[#2196f3] rounded-full transition-all duration-500 ease-in-out"
                      style={{ width: `${ambulanceProgress}%` }}
                    ></div>
                  </div>

                  {/* Traffic lights indicators */}
                  {trafficLights.map((light) => (
                    <div
                      key={light.id}
                      className="absolute top-0 -mt-1 transform -translate-x-1/2"
                      style={{ left: `${light.position}%` }}
                    >
                      <div
                        className={`w-4 h-4 rounded-full ${light.status === "red" ? "bg-[#f44336]" : "bg-[#4caf50]"} border-2 border-white shadow-md`}
                      ></div>
                    </div>
                  ))}

                  {/* Ambulance indicator */}
                  <div
                    className="absolute top-0 -mt-3 transform -translate-x-1/2 transition-all duration-500 ease-in-out"
                    style={{ left: `${ambulanceProgress}%` }}
                  >
                    <Ambulance className="h-6 w-6 text-[#2196f3]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-0 shadow rounded-xl">
              <CardHeader className="bg-white pb-2">
                <CardTitle className="text-[#334155] font-medium">Route Information</CardTitle>
                <CardDescription className="text-[#64748b]">Details about your journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-3">
                {/* Rest of the content remains the same */}
                <div className="space-y-2">
                  <div className="text-sm text-[#64748b]">From</div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 text-[#64748b] mt-0.5" />
                    <div>
                      <div className="font-medium text-[#334155]">Current Location</div>
                      <div className="text-sm text-[#64748b]">Mohammed V Square, Casablanca</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-[#64748b]">To</div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 mr-2 text-[#2196f3] mt-0.5" />
                    <div>
                      <div className="font-medium text-[#334155]">CHU Ibn Rochd Hospital</div>
                      <div className="text-sm text-[#64748b]">Avenue Hassan II, Casablanca</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <div className="flex justify-between items-center p-3 bg-[#f8fafc] rounded-md">
                    <div className="flex items-center">
                      <Navigation className="h-5 w-5 mr-2 text-[#2196f3]" />
                      <span className="text-[#334155]">Distance</span>
                    </div>
                    <div className="font-medium text-[#334155]">{distance}</div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-[#f8fafc] rounded-md">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-[#2196f3]" />
                      <span className="text-[#334155]">Estimated Time</span>
                    </div>
                    <div className="font-medium text-[#334155]">{eta}</div>
                  </div>

                  <div className="flex items-center p-3 bg-[#fff8e1] text-[#f57c00] rounded-md">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    <div className="text-sm">
                      <span className="font-medium">Traffic Alert:</span> Moderate traffic on Boulevard Zerktouni
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="text-sm font-medium mb-2 text-[#334155]">Turn-by-turn directions:</div>
                  <ol className="space-y-2 pl-5 list-decimal">
                    <li className="text-sm text-[#475569]">Head north on Mohammed V Square</li>
                    <li className="text-sm text-[#475569]">Continue onto Boulevard Mohammed V for 0.6 km</li>
                    <li className="text-sm text-[#475569]">Turn right onto Boulevard Zerktouni</li>
                    <li className="text-sm text-[#475569]">Turn left onto Boulevard d&apos;Anfa</li>
                    <li className="text-sm text-[#475569]">Continue onto Avenue Hassan II</li>
                    <li className="text-sm text-[#475569]">CHU Ibn Rochd Hospital will be on your right</li>
                  </ol>
                </div>
              </CardContent>
              <CardFooter className="bg-[#f8fafc] border-t border-[#e2e8f0] py-4">
                <Button 
                  className="w-full bg-[#2196f3] hover:bg-[#1e88e5] text-white" 
                  onClick={() => router.push("/ambulance/submission-success")}
                >
                  <Ambulance className="mr-2 h-4 w-4" /> Arrived at Hospital
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  )
}