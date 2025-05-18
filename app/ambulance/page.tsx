"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, ArrowRight, MapPin, AlertTriangle } from "lucide-react"

export default function ServiceSelection() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [serviceType, setServiceType] = useState<string>("")
  const [patientAge, setPatientAge] = useState<string>("")
  const [patientGender, setPatientGender] = useState<string>("")
  const [patientLocation, setPatientLocation] = useState<{latitude: number, longitude: number} | null>(null)
  const [isEmergency, setIsEmergency] = useState<boolean>(false)
  const [requiresImmediate, setRequiresImmediate] = useState<boolean>(false)

  // Load any existing patient data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("patientData")
    if (savedData) {
      const data = JSON.parse(savedData)
      
      // If we have location data, set it
      if (data.location) {
        setPatientLocation(data.location)
      } else {
        // If no location data, redirect to the location selection page
        router.push("/ambulance/patient-location")
      }
      
      // Set any other existing data if present
      if (data.age) setPatientAge(data.age)
      if (data.gender) setPatientGender(data.gender)
      if (data.serviceType) setServiceType(data.serviceType)
      if (data.isEmergency !== undefined) setIsEmergency(data.isEmergency)
      if (data.requiresImmediate !== undefined) setRequiresImmediate(data.requiresImmediate)
    } else {
      // No data at all, redirect to the location selection page
      router.push("/ambulance/patient-location")
    }
        const fetchAmbulanceData = async () => {
      if (isLoaded && user) {
        try {
          // Check if we already have the ambulance ID in localStorage
          if (!localStorage.getItem("ambulanceId")) {
            try {
              // First try to get the existing ambulance
              const response = await fetch(`/api/ambulance/get-ambulance?userId=${user.id}`);
              
              if (response.ok) {
                const data = await response.json();
                
                // If a mock was used, create a real ambulance
                if (data.mockUsed) {
                  // Create a real ambulance for this user
                  try {
                    const createResponse = await fetch("/api/ambulance/create-ambulance", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      }
                    });
                    
                    if (createResponse.ok) {
                      const createData = await createResponse.json();
                      localStorage.setItem("ambulanceId", createData.ambulanceId);
                      console.log("Created and saved ambulance ID:", createData.ambulanceId);
                    } else {
                      console.error("Failed to create ambulance");
                      // Still use the mock ID for now
                      localStorage.setItem("ambulanceId", data.ambulanceId);
                    }
                  } catch (createError) {
                    console.error("Error creating ambulance:", createError);
                    // Use the mock ID as a fallback
                    localStorage.setItem("ambulanceId", data.ambulanceId);
                  }
                } else {
                  // Use the real ambulance ID
                  localStorage.setItem("ambulanceId", data.ambulanceId);
                  console.log("Saved ambulance ID to localStorage:", data.ambulanceId);
                }
              } else {
                console.error("Failed to fetch ambulance data, status:", response.status);
                // Use a default mock ambulance ID as fallback
                const fallbackId = "00000000-0000-0000-0000-000000000001";
                localStorage.setItem("ambulanceId", fallbackId);
                console.log("Using fallback ambulance ID:", fallbackId);
              }
            } catch (fetchError) {
              console.error("Network error fetching ambulance data:", fetchError);
              // Use a default mock ambulance ID as fallback
              const fallbackId = "00000000-0000-0000-0000-000000000001";
              localStorage.setItem("ambulanceId", fallbackId);
              console.log("Using fallback ambulance ID:", fallbackId);
            }
          }
        } catch (error) {
          console.error("Error in ambulance data flow:", error);
          // Final fallback - ensure we always have an ambulance ID
          if (!localStorage.getItem("ambulanceId")) {
            const fallbackId = "00000000-0000-0000-0000-000000000001";
            localStorage.setItem("ambulanceId", fallbackId);
            console.log("Using emergency fallback ambulance ID:", fallbackId);
          }
        }
      }
    };

    fetchAmbulanceData();
  }, [router, isLoaded, user])

  const handleContinue = () => {
    if (patientLocation) {
      // Save all the data
      localStorage.setItem(
        "patientData",
        JSON.stringify({
          age: patientAge,
          gender: patientGender,
          serviceType: serviceType,
          location: patientLocation,
          isEmergency,
          requiresImmediate
        }),
      )

      router.push("/ambulance/hospital-list")
    } else {
      // If somehow the location is missing, redirect back to location selection
      router.push("/ambulance/patient-location")
    }
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }
  
  return (
    <div className="bg-slate-50 min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-3xl font-semibold text-slate-800 mb-6">Service Selection</div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          {patientLocation && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start">
              <MapPin className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="text-slate-800 font-medium">Patient location set</p>
                <p className="text-slate-600 text-sm">
                  Latitude: {patientLocation.latitude.toFixed(6)}, 
                  Longitude: {patientLocation.longitude.toFixed(6)}
                </p>
                <button 
                  onClick={() => router.push("/ambulance/patient-location")}
                  className="text-blue-600 text-sm mt-1 hover:underline"
                >
                  Change location
                </button>
              </div>
            </div>
          )}
        
          <div className="text-lg text-slate-600 mb-6">
            Select the type of medical service needed
          </div>
          
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
            <motion.div variants={item}>
              <div className="space-y-4">
                <Label htmlFor="service-type" className="text-slate-700 font-medium text-base">
                  Service Type
                </Label>
                <RadioGroup 
                  value={serviceType} 
                  onValueChange={setServiceType} 
                  className="grid grid-cols-1 md:grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="or-room"
                    className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                      serviceType === "or-room" ? "border-blue-500 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <RadioGroupItem value="or-room" id="or-room" className="text-blue-500" />
                    <span className="font-medium text-slate-800">OR Room</span>
                  </Label>
                  <Label
                    htmlFor="check-up"
                    className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                      serviceType === "check-up" ? "border-blue-500 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <RadioGroupItem value="check-up" id="check-up" className="text-blue-500" />
                    <span className="font-medium text-slate-800">Check-up</span>
                  </Label>
                  <Label
                    htmlFor="medicine"
                    className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                      serviceType === "medicine" ? "border-blue-500 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <RadioGroupItem value="medicine" id="medicine" className="text-blue-500" />
                    <span className="font-medium text-slate-800">Medicine</span>
                  </Label>
                  <Label
                    htmlFor="consultation"
                    className={`flex items-center space-x-3 rounded-lg border-2 p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                      serviceType === "consultation" ? "border-blue-500 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <RadioGroupItem value="consultation" id="consultation" className="text-blue-500" />
                    <span className="font-medium text-slate-800">Consultation with a doctor</span>
                  </Label>
                </RadioGroup>
              </div>
            </motion.div>

            <motion.div variants={item}>
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2 rounded-lg border-2 border-slate-200 p-4 hover:bg-slate-50">
                  <div className="space-y-1">
                    <Label htmlFor="emergency" className="text-slate-800 font-medium">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        Badly Injured
                      </div>
                    </Label>
                    <p className="text-sm text-slate-500">
                      Patient has severe injuries requiring immediate attention
                    </p>
                  </div>
                  <Switch
                    id="emergency"
                    checked={isEmergency}
                    onCheckedChange={setIsEmergency}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>

                <div className="flex items-center justify-between space-x-2 rounded-lg border-2 border-slate-200 p-4 hover:bg-slate-50">
                  <div className="space-y-1">
                    <Label htmlFor="immediate" className="text-slate-800 font-medium">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        Requires Immediate Attention
                      </div>
                    </Label>
                    <p className="text-sm text-slate-500">
                      Patient&apos;s condition is critical and requires immediate medical intervention
                    </p>
                  </div>
                  <Switch
                    id="immediate"
                    checked={requiresImmediate}
                    onCheckedChange={setRequiresImmediate}
                    className="data-[state=checked]:bg-red-500"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="patient-age" className="text-slate-700 font-medium">
                  Estimated Patient Age
                </Label>
                <Input
                  id="patient-age"
                  type="number"
                  placeholder="Enter estimated age"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value)}
                  className="border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="patient-gender" className="text-slate-700 font-medium">
                  Patient Gender
                </Label>
                <RadioGroup 
                  value={patientGender} 
                  onValueChange={setPatientGender} 
                  className="flex space-x-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" className="text-blue-500" />
                    <Label htmlFor="male" className="font-medium text-slate-800">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" className="text-blue-500" />
                    <Label htmlFor="female" className="font-medium text-slate-800">Female</Label>
                  </div>
                </RadioGroup>
              </div>
            </motion.div>
          </motion.div>
          
          <div className="flex justify-between mt-10">
            <Button 
              variant="outline" 
              onClick={() => router.push("/ambulance/patient-location")}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button 
              onClick={handleContinue} 
              disabled={!serviceType || !patientAge || !patientGender || !patientLocation}
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