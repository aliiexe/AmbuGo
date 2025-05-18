"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, MapPin, Clock, Loader2 } from "lucide-react"

interface HospitalDetails {
  distance: number | null
  adresse: string
  capacite_totale: number
  lits_disponibles: number
  numero_contact: string
  latitude: string
  longitude: string
  doctors: {name: string, specialty: string}[]
  equipment: string[]
  medications: string[]
  trafficCondition: string
}

interface Hospital {
  id: string
  nom: string
  comment: string
  recommendation_score: number
  hospital_details: HospitalDetails
  // UI-specific fields
  trafficCondition?: {
    text: string
    className: string
  }
}

// Define the hospital recommendation interface from our API
interface HospitalRecommendation {
  hospital_id: string
  hospital_name: string
  comment: string
  recommendation_score: number
  hospital_details: HospitalDetails
}

export default function HospitalList() {
  const router = useRouter()
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null)
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load hospitals based on patient location
  useEffect(() => {
    const loadHospitals = async () => {
      try {
        // Get patient location from localStorage
        const savedData = localStorage.getItem("patientData")
        if (!savedData) {
          router.push("/ambulance/patient-location")
          return
        }

        const data = JSON.parse(savedData)
        if (!data.location) {
          router.push("/ambulance/patient-location")
          return
        }

        // setPatientData(data) // Removed: no such state defined
        console.log("Patient data:", data)

        // Using the improved hospital-recommendations API
        const response = await fetch("/api/hospital-recommendations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientData: {
              isUrgent: data.isUrgent || false,
              condition: data.condition || "",
              requiredEquipment: data.requiredEquipment || [],
              age: data.age || 30,
              requiredMedications: data.requiredMedications || [],
              latitude: data.location.latitude,
              longitude: data.location.longitude,
            },
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("API error response:", errorText)
          throw new Error(`Failed to fetch hospital recommendations: ${response.statusText}`)
        }

        const recommendationsData = await response.json()
        console.log("Recommendations data:", recommendationsData)
        
        if (!recommendationsData.recommendations || !Array.isArray(recommendationsData.recommendations)) {
          console.error("Invalid recommendations format:", recommendationsData)
          throw new Error("Invalid response format from hospital recommendations API")
        }

        // Process recommendations and add UI-specific fields
        const processedHospitals = recommendationsData.recommendations.map((rec: HospitalRecommendation) => {
          // Determine traffic condition class based on French traffic description
          const trafficUICondition = getTrafficUICondition(rec.hospital_details.trafficCondition);
          
          return {
            id: rec.hospital_id,
            nom: rec.hospital_name,
            comment: rec.comment,
            recommendation_score: rec.recommendation_score,
            hospital_details: rec.hospital_details,
            trafficCondition: trafficUICondition
          };
        });

        console.log("Processed hospitals:", processedHospitals);
        setHospitals(processedHospitals);
        setLoading(false);
      } catch (err: unknown) {
        console.error("Error loading hospitals:", err)
        setError(
          err && typeof err === "object" && "message" in err
            ? (err as { message?: string }).message || "Failed to load hospitals"
            : "Failed to load hospitals"
        )
        setLoading(false)
      }
    }

    loadHospitals()
  }, [router])

  // Helper function to convert French traffic condition to UI display format
  const getTrafficUICondition = (trafficCondition: string): { text: string, className: string } => {
    switch (trafficCondition) {
      case "léger":
        return { text: "Clear", className: "text-green-600" };
      case "modéré":
        return { text: "Moderate Traffic", className: "text-orange-600" };
      case "dense":
        return { text: "Heavy Traffic", className: "text-red-600" };
      default:
        return { text: "Unknown", className: "text-slate-600" };
    }
  }

  const handleContinue = () => {
    if (selectedHospital) {
      // Save the selected hospital to localStorage
      const selectedHospitalData = hospitals.find(h => h.id === selectedHospital)
      
      if (selectedHospitalData) {
        const savedData = localStorage.getItem("patientData")
        const patientData = savedData ? JSON.parse(savedData) : {}
        
        localStorage.setItem(
          "patientData",
          JSON.stringify({
            ...patientData,
            selectedHospital: selectedHospitalData
          })
        )
      }
      
      router.push("/ambulance/patient-form")
    }
  }

  const getAvailabilityStatus = (total: number, available: number) => {
    const percentage = (available / total) * 100
    
    if (percentage >= 50) return { text: "High", className: "bg-green-100 text-green-800" }
    if (percentage >= 20) return { text: "Medium", className: "bg-yellow-100 text-yellow-800" }
    return { text: "Low", className: "bg-red-100 text-red-800" }
  }

  const getEstimatedTime = (distanceKm: number) => {
    // Rough estimate: 2 min per km with a minimum of 5 minutes
    const estimatedMinutes = Math.max(5, Math.round(distanceKm * 2))
    return `${estimatedMinutes} min`
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
        <div className="text-3xl font-semibold text-slate-800 mb-6">Recommended Hospitals</div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="text-lg text-slate-600 mb-6">
            Select the most suitable hospital for the patient
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-slate-600">Finding the best hospitals...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {error}. Please try again or select patient location.
              <div className="mt-4">
                <Button
                  onClick={() => router.push("/ambulance/patient-location")}
                  className="bg-red-100 hover:bg-red-200 text-red-700"
                >
                  Set Patient Location
                </Button>
              </div>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
              No hospitals found near this location. Please try a different location.
              <div className="mt-4">
                <Button
                  onClick={() => router.push("/ambulance/patient-location")}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
                >
                  Change Location
                </Button>
              </div>
            </div>
          ) : (
            <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
              {hospitals.map((hospital, index) => {
                const details = hospital.hospital_details;
                const availabilityStatus = getAvailabilityStatus(
                  details.capacite_totale, 
                  details.lits_disponibles
                );
                const distance = details.distance || 0;
                const eta = getEstimatedTime(distance);
                
                return (
                  <motion.div key={hospital.id} variants={item}>
                    <div
                      className={`bg-white border-2 rounded-xl cursor-pointer transition-all hover:shadow-md p-4 ${
                        selectedHospital === hospital.id 
                          ? "border-blue-500 shadow-sm" 
                          : "border-slate-200"
                      }`}
                      onClick={() => setSelectedHospital(hospital.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <div className="bg-blue-100 text-blue-600 font-bold rounded-full w-6 h-6 flex items-center justify-center mr-2">
                              {index + 1}
                            </div>
                            <h3 className="font-semibold text-lg text-slate-800">{hospital.nom}</h3>
                            {hospital.recommendation_score && (
                              <span className="ml-2 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                                Score: {hospital.recommendation_score}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-slate-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm mr-3">{distance.toFixed(1)} km</span>
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="text-sm">ETA: {eta}</span>
                          </div>
                        </div>
                        {/* We don't have ratings so let's use bed availability as an indicator */}
                        <div className="flex items-center">
                          <span className="font-medium text-slate-700">
                            {Math.round((details.lits_disponibles / details.capacite_totale) * 100)}%
                          </span>
                          <span className="text-sm text-slate-500 ml-1">capacity</span>
                        </div>
                      </div>

                      {hospital.comment && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm text-slate-700 italic">
                          &quot;{hospital.comment}&quot;
                        </div>
                      )}

                      <div className="mt-3 p-2 bg-slate-50 rounded-md">
                        <div className="flex items-center text-sm">
                          <span className="font-medium mr-2 text-slate-700">Route:</span>
                          {hospital.trafficCondition ? (
                            <span className={`flex items-center ${hospital.trafficCondition.className}`}>
                              <span className={`inline-block w-2 h-2 rounded-full ${hospital.trafficCondition.className.replace('text-', 'bg-')} mr-1`}></span>
                              {hospital.trafficCondition.text}
                            </span>
                          ) : (
                            <span className="flex items-center text-slate-600">
                              <span className={`inline-block w-2 h-2 rounded-full bg-slate-500 mr-1`}></span>
                              Est. {eta} travel time
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {details.equipment && details.equipment.length > 0 && (
                          <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-normal border-0">
                            {details.equipment.length} Equipment Types
                          </Badge>
                        )}
                        {details.lits_disponibles > 0 && (
                          <Badge className="bg-green-50 text-green-600 hover:bg-green-100 font-normal border-0">
                            {details.lits_disponibles} Beds Available
                          </Badge>
                        )}
                        {details.doctors && details.doctors.length > 0 && (
                          <Badge className="bg-purple-50 text-purple-600 hover:bg-purple-100 font-normal border-0">
                            {details.doctors.length} Doctors
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <span className="text-sm mr-2 text-slate-600">Availability:</span>
                          <Badge className={availabilityStatus.className}>
                            {availabilityStatus.text}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-600">
                          <span className="font-medium text-slate-700">{details.lits_disponibles}</span> of {details.capacite_totale} beds available
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Address:</span> {details.adresse}
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium text-slate-700">Contact:</span> {details.numero_contact}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={() => router.push("/ambulance")}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button 
              onClick={handleContinue} 
              disabled={selectedHospital === null || loading}
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