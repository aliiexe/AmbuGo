"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Home } from "lucide-react"

export default function SubmissionSuccess() {
  const router = useRouter()

  return (
    <>
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <Card className="w-full border-0 shadow-md">
            <CardHeader>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="mx-auto mb-4 rounded-full bg-primary/10 p-3 w-16 h-16 flex items-center justify-center"
              >
                <CheckCircle className="h-8 w-8 text-primary" />
              </motion.div>
              <CardTitle className="text-2xl">Mission Complete</CardTitle>
              <CardDescription>Patient has been successfully transported to the hospital</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The patient has been safely delivered to City General Hospital. The hospital staff has been notified and
                is ready to provide immediate care.
              </p>
              <div className="mt-6 p-4 bg-muted rounded-md">
                <p className="font-medium">Journey completed in 12 minutes</p>
                <p className="text-sm text-muted-foreground mt-1">Thank you for using AmbuGo</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6" onClick={() => router.push("/")}>
                <Home className="mr-2 h-4 w-4" /> Return to Home
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
