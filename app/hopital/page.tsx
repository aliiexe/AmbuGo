"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, AlertTriangle, Clock, MapPin, Ambulance, Loader2 } from "lucide-react"
import { useUser } from "@clerk/nextjs"

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  symptoms: string
  serviceType: string
  isEmergency: boolean
  requiresImmediate: boolean
  status: string
  eta?: string
  arrivalTime?: string
}

export default function HospitalDashboard() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("incoming")
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatients = async () => {
      if (!isLoaded || !user) return;
      
      try {
        setIsLoading(true);
        
        // Get the hospital ID for the current user
        const hospitalUserResponse = await fetch(`/api/hospital/get-hospital-id?userId=${user.id}`);
        if (!hospitalUserResponse.ok) {
          const errorData = await hospitalUserResponse.json();
          console.error("Hospital ID API error:", errorData);
          throw new Error("Failed to fetch hospital information: " + (errorData.details || ""));
        }
        
        const { hospitalId } = await hospitalUserResponse.json();
        if (!hospitalId) {
          throw new Error("No hospital ID found for this user");
        }
        
        console.log("Using hospital ID:", hospitalId);
        
        // Fetch all patients for this hospital in a single call
        const patientsResponse = await fetch(`/api/hospital/patients?hospitalId=${hospitalId}`);
        if (!patientsResponse.ok) {
          const errorData = await patientsResponse.json();
          console.error("Patients API error:", errorData);
          throw new Error("Failed to fetch patients: " + (errorData.details || ""));
        }
        
        const data = await patientsResponse.json();
        setPatients(data.patients || []);
      } catch (err: any) {
        console.error("Error fetching patients:", err);
        setError(err.message || "Failed to load patient data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPatients();
  }, [isLoaded, user]);

  // Filter patients based on the active tab
  const incomingPatients = patients.filter(patient => 
    patient.status === 'en-route'
  );
  
  const arrivedPatients = patients.filter(patient => 
    patient.status === 'arrived' || patient.status === 'waiting' || patient.status === 'in_treatment'
  );

  const getPatientById = (id: string) => {
    return patients.find((patient) => patient.id === id);
  };

  const updatePatientStatus = async (patientId: string) => {
    try {
      // If patient is incoming, mark as arrived; if already arrived, toggle between waiting and in treatment
      const patient = getPatientById(patientId);
      if (!patient) return;
      
      const newStatus = patient.status === 'en-route' ? 'arrived' : 'toggle';
      
      const response = await fetch('/api/hospital/update-patient-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update patient status');
      }

      // Refresh the data after update
      if (user) {
        const { hospitalId } = await (await fetch(`/api/hospital/get-hospital-id?userId=${user.id}`)).json();
        const refreshedData = await (await fetch(`/api/hospital/patients?hospitalId=${hospitalId}`)).json();
        setPatients(refreshedData.patients || []);
      }
    } catch (error) {
      console.error('Error updating patient status:', error);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading patient data...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-destructive/10 rounded-lg">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-bold mb-2">Failed to load data</h2>
          <p className="mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="min-h-[calc(100vh-3.5rem)] p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-6xl mx-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Hospital Dashboard</h1>
              <p className="text-muted-foreground">Monitor incoming and arrived patients</p>
            </div>
            <Button variant="outline" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Queue</CardTitle>
                  <CardDescription>View and manage incoming and arrived patients</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="incoming" onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="incoming">
                        Incoming {incomingPatients.length > 0 && `(${incomingPatients.length})`}
                      </TabsTrigger>
                      <TabsTrigger value="arrived">
                        Arrived {arrivedPatients.length > 0 && `(${arrivedPatients.length})`}
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="incoming">
                      {incomingPatients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No incoming patients at the moment</p>
                        </div>
                      ) : (
                        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                          {incomingPatients.map((patient) => (
                            <motion.div key={patient.id} variants={item}>
                              <Card
                                className={`cursor-pointer transition-all hover:shadow-md ${selectedPatient === patient.id ? "border-primary ring-2 ring-primary ring-opacity-50" : ""}`}
                                onClick={() => setSelectedPatient(patient.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                      <Avatar className="h-10 w-10 mr-3">
                                        <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h3 className="font-semibold">{patient.name}</h3>
                                        <div className="text-sm text-muted-foreground">
                                          {patient.age} years, {patient.gender}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center">
                                      <Badge variant="outline" className="flex items-center">
                                        <Clock className="h-3 w-3 mr-1" />
                                        ETA: {patient.eta || "10 min"}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="mt-3">
                                    <Badge className="mr-2">{patient.serviceType}</Badge>
                                    {patient.isEmergency && (
                                      <Badge variant="destructive" className="mr-2">
                                        Emergency
                                      </Badge>
                                    )}
                                    {patient.requiresImmediate && (
                                      <Badge variant="destructive">Immediate Attention</Badge>
                                    )}
                                  </div>

                                  <div className="mt-3 text-sm">
                                    <span className="font-medium">Symptoms:</span> {patient.symptoms}
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </TabsContent>
                    <TabsContent value="arrived">
                      {arrivedPatients.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Ambulance className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No arrived patients to display</p>
                        </div>
                      ) : (
                        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
                          {arrivedPatients.map((patient) => (
                            <motion.div key={patient.id} variants={item}>
                              <Card
                                className={`cursor-pointer transition-all hover:shadow-md ${selectedPatient === patient.id ? "border-primary ring-2 ring-primary ring-opacity-50" : ""}`}
                                onClick={() => setSelectedPatient(patient.id)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center">
                                      <Avatar className="h-10 w-10 mr-3">
                                        <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h3 className="font-semibold">{patient.name}</h3>
                                        <div className="text-sm text-muted-foreground">
                                          {patient.age} years, {patient.gender}
                                        </div>
                                      </div>
                                    </div>
                                    <Badge variant={patient.status === "waiting" ? "outline" : "secondary"}>
                                      {patient.status === "in_treatment" ? "In Treatment" : 
                                       patient.status === "waiting" ? "Waiting" : "Arrived"}
                                    </Badge>
                                  </div>

                                  <div className="mt-3">
                                    <Badge className="mr-2">{patient.serviceType}</Badge>
                                    {patient.isEmergency && (
                                      <Badge variant="destructive" className="mr-2">
                                        Emergency
                                      </Badge>
                                    )}
                                    {patient.requiresImmediate && (
                                      <Badge variant="destructive">Immediate Attention</Badge>
                                    )}
                                  </div>

                                  <div className="mt-3 text-sm">
                                    <span className="font-medium">Symptoms:</span> {patient.symptoms}
                                  </div>

                                  <div className="mt-2 text-sm text-muted-foreground">Arrived: {patient.arrivalTime || "Recently"}</div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div>
              {selectedPatient ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Details</CardTitle>
                    <CardDescription>Detailed information about the selected patient</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const patient = getPatientById(selectedPatient)
                      if (!patient) return null

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <Avatar className="h-16 w-16 mr-4">
                              <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h2 className="text-xl font-bold">{patient.name}</h2>
                              <p className="text-muted-foreground">
                                {patient.age} years, {patient.gender}
                              </p>
                            </div>
                          </div>

                          {patient.status === "en-route" && (
                            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                              <div className="flex items-center">
                                <Ambulance className="h-5 w-5 mr-2 text-primary" />
                                <span>En Route</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>ETA: {patient.eta || "10 min"}</span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Service Required</h3>
                              <p>{patient.serviceType}</p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Symptoms</h3>
                              <p>{patient.symptoms}</p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {patient.isEmergency && (
                                  <div className="flex items-center text-destructive">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    <span>Emergency Case</span>
                                  </div>
                                )}
                                {patient.requiresImmediate && (
                                  <div className="flex items-center text-destructive">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    <span>Immediate Attention</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <Button className="w-full" onClick={() => updatePatientStatus(patient.id)}>
                              {patient.status === "en-route" ? "Mark as Arrived" : 
                               patient.status === "waiting" ? "Start Treatment" :
                               patient.status === "in_treatment" ? "Mark as Waiting" : "Update Status"}
                            </Button>
                          </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <MapPin className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-2">No Patient Selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Select a patient from the list to view detailed information
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}