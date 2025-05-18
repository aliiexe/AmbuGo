"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send } from "lucide-react"
import { useUser } from "@clerk/nextjs"

export default function PatientForm() {
  const router = useRouter()
  const { isSignedIn, user } = useUser()
  useEffect(() => {
    if (typeof window !== "undefined" && isSignedIn && user && user.id) {
      localStorage.setItem("ambulanceId", user.id)
      console.log("User data:", user)
    }
  }, [isSignedIn, user])
  const [formData, setFormData] = useState(() => {
    // Check if we're in the browser environment
    if (typeof window !== "undefined") {
      // Try to get patient data from localStorage
      const savedData = localStorage.getItem("patientData")
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        return {
          fullName: "",
          age: parsedData.age || "",
          gender: parsedData.gender || "",
          symptoms: "",
        }
      }
    }

    // Default state if no saved data
    return {
      fullName: "",
      age: "",
      gender: "",
      symptoms: "",
    }
  })

  useEffect(() => {
    // Try to get patient data from localStorage
    const savedData = localStorage.getItem("patientData")
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setFormData((prevData) => ({
        ...prevData,
        age: parsedData.age || prevData.age,
        gender: parsedData.gender || prevData.gender,
      }))
    }
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    try {
      // 1️⃣ Grab patient data from localStorage
      const savedData = localStorage.getItem("patientData");
      if (!savedData) {
        console.error("No patient data found");
        return;
      }
      const patientData = JSON.parse(savedData);

      // 2️⃣ Grab the Clerk user_id (mis‑named ambulanceId in your storage)
      const ambulanceUserId = localStorage.getItem("ambulanceId");
      if (!user?.id || !ambulanceUserId) {
        console.error("Missing signed‑in user or ambulanceUserId");
        return;
      }

      // 3️⃣ Lookup real ambulance.id on your server
      const lookupRes = await fetch("/api/ambulance/get-ambulance-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: ambulanceUserId }),
      });
      if (!lookupRes.ok) {
        throw new Error(`Lookup failed: ${await lookupRes.text()}`);
      }
      const { ambulanceId } = await lookupRes.json(); 
      // now you have the real PK from ambulances table

      // 4️⃣ Package up everything — now with the real ambulanceId
      const payload = {
        fullName:    formData.fullName,
        age:         formData.age,
        gender:      formData.gender,
        symptoms:    formData.symptoms,
        selectedHospital: patientData.selectedHospital,
        isEmergency:      patientData.isEmergency,
        requiresImmediate: patientData.requiresImmediate,
        serviceType:      patientData.serviceType,
        location:         patientData.location,
        ambulanceId,             // <-- real ambulance PK
      };

      // 5️⃣ Submit the patient record
      const saveRes = await fetch("/api/patient-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!saveRes.ok) {
        throw new Error(`Save failed: ${await saveRes.text()}`);
      }

      // 6️⃣ Success!
      router.push("/ambulance/route-map");
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      // show a friendly message to the user here
    }
  };


  const isFormValid = () => {
    return formData.fullName && formData.age && formData.gender && formData.symptoms
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
        <div className="text-3xl font-semibold text-slate-800 mb-6">Patient Information</div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="text-lg text-slate-600 mb-6">
            Enter details about the patient&apos;s condition
          </div>
          
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={item}>
              <div className="space-y-3">
                <Label htmlFor="full-name" className="text-slate-700 font-medium">Full Name</Label>
                <Input
                  id="full-name"
                  placeholder="Enter patient's full name"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="age" className="text-slate-700 font-medium">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter age"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className="border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="gender" className="text-slate-700 font-medium">Gender</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => handleChange("gender", value)}
                  className="flex space-x-4 pt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="gender-male" className="text-blue-500" />
                    <Label htmlFor="gender-male" className="font-medium text-slate-700">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="gender-female" className="text-blue-500" />
                    <Label htmlFor="gender-female" className="font-medium text-slate-700">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="gender-other" className="text-blue-500" />
                    <Label htmlFor="gender-other" className="font-medium text-slate-700">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </motion.div>

            <motion.div variants={item}>
              <div className="space-y-3">
                <Label htmlFor="symptoms" className="text-slate-700 font-medium">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe the patient's symptoms"
                  className="min-h-[120px] border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  value={formData.symptoms}
                  onChange={(e) => handleChange("symptoms", e.target.value)}
                />
              </div>
            </motion.div>
          </motion.div>
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={() => router.push("/hospital-list")}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="mr-2 h-4 w-4" /> Submit
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}