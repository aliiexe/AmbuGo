import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { sql } from "drizzle-orm";

interface PatientDataRequest {
  fullName: string;
  age: string | number;
  gender: string;
  symptoms: string;
  selectedHospital: {
    id: string;
    nom: string;
  };
  isEmergency?: boolean;
  requiresImmediate?: boolean;
  serviceType?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  ambulanceId?: string;
}

export async function POST(request: Request) {
  try {
    const data: PatientDataRequest = await request.json();
    
    // Validate required fields
    if (!data.fullName || !data.age || !data.gender || !data.symptoms || !data.selectedHospital?.id) {
      return NextResponse.json(
        { error: "Missing required patient information" },
        { status: 400 }
      );
    }

    // Create a medical record with the available information
    const medicalRecord = {
      symptoms: data.symptoms,
      gender: data.gender,
      isEmergency: data.isEmergency || false,
      requiresImmediate: data.requiresImmediate || false,
      serviceType: data.serviceType || 'General',
      location: data.location || null
    };

    // Check if ambulanceId is provided
    const hasAmbulanceId = !!data.ambulanceId;

    // Insert patient data into database using the correct column names from your schema
    // Note: We're now conditionally including the ambulance_id field
    const result = await db.execute(sql`
      INSERT INTO patients (
        nom, 
        age, 
        cin,
        groupe_sanguin,
        numero_contact,
        adresse,
        hopital_id,
        dossier_medical
        ${hasAmbulanceId ? sql`, ambulance_id` : sql``}
      ) VALUES (
        ${data.fullName},
        ${parseInt(data.age.toString())},
        ${'N/A'}, -- Placeholder for CIN
        ${'N/A'}, -- Placeholder for blood group
        ${'N/A'}, -- Placeholder for contact number
        ${'N/A'}, -- Placeholder for address
        ${data.selectedHospital.id},
        ${JSON.stringify(medicalRecord)}
        ${hasAmbulanceId ? sql`, ${data.ambulanceId}::uuid` : sql``}
      ) RETURNING id
    `);

    const patientId = result.rows[0]?.id;

    return NextResponse.json({ 
      success: true, 
      message: "Patient information saved successfully",
      patientId
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error saving patient data:", error);
      return NextResponse.json(
        { error: "Failed to save patient information", details: error.message },
        { status: 500 }
      );
    } else {
      console.error("Error saving patient data:", error);
      return NextResponse.json(
        { error: "Failed to save patient information", details: String(error) },
        { status: 500 }
      );
    }
  }
}