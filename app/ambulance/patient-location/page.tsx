"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"

// Dynamically import the map component to avoid SSR issues
const LocationMap = dynamic(() => import("./LocationMap"), { 
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-slate-100 rounded-lg flex items-center justify-center">
      <p className="text-slate-500">Loading map...</p>
    </div>
  )
})

export default function PatientLocation() {
  const router = useRouter()
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null)
  
  const handleContinue = () => {
    if (coordinates) {
      // Save the coordinates to localStorage
      const existingData = localStorage.getItem("patientData")
      const patientData = existingData ? JSON.parse(existingData) : {}
      
      localStorage.setItem(
        "patientData",
        JSON.stringify({
          ...patientData,
          location: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          }
        })
      )
      
      // Navigate to service selection page
      router.push("/ambulance")
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-3xl font-semibold text-slate-800 mb-6">Patient Location</div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="text-lg text-slate-600 mb-6">
            Set the pin to the patient&apos;s exact location
          </div>
          
          <div className="mb-6">
            <Label className="text-slate-700 font-medium text-base mb-2 block">
              Map Pin Location
            </Label>
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <LocationMap 
                onLocationSelected={setCoordinates} 
              />
            </div>
          </div>
          
          {coordinates && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start">
              <MapPin className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="text-slate-800 font-medium">Patient location selected</p>
                <p className="text-slate-600 text-sm">
                  Latitude: {coordinates.latitude.toFixed(6)}, 
                  Longitude: {coordinates.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-between mt-10">
            <Button 
              variant="outline" 
              onClick={() => router.push("/")}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button 
              onClick={handleContinue} 
              disabled={!coordinates}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 