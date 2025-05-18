import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    console.log("API: Received request to update patient status");
    
    // Parse the request body
    const body = await request.json();
    const { patientId, newStatus } = body;

    console.log(`API: Parameters - patientId: ${patientId}, newStatus: ${newStatus}`);

    if (!patientId) {
      console.log("API: Missing patientId parameter");
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Get the current patient status to determine what to update
    const currentPatientQuery = sql`
      SELECT 
        id, 
        dossier_medical->>'status' as status
      FROM patients
      WHERE 
        id = ${patientId}::uuid
    `;

    const currentPatientResult = await db.execute(currentPatientQuery);
    
    if (!currentPatientResult.rows || currentPatientResult.rows.length === 0) {
      console.log(`API: Patient with ID ${patientId} not found`);
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const currentPatient = currentPatientResult.rows[0];
    let statusToSet = newStatus;
    
    // Handle the toggle logic
    if (newStatus === 'toggle') {
      const currentStatus = currentPatient.status || 'arrived';
      statusToSet = currentStatus === 'in_treatment' ? 'waiting' : 'in_treatment';
    }
    
    console.log(`API: Updating status from ${currentPatient.status} to ${statusToSet}`);

    // Update the patient status in the dossier_medical JSONB field
    const updateQuery = sql`
      UPDATE patients
      SET dossier_medical = jsonb_set(
        COALESCE(dossier_medical, '{}'::jsonb), 
        '{status}', 
        ${JSON.stringify(statusToSet)}::jsonb
      )
      WHERE id = ${patientId}::uuid
      RETURNING id, hopital_id
    `;

    const result = await db.execute(updateQuery);
    
    if (!result.rows || result.rows.length === 0) {
      console.log(`API: Failed to update patient ${patientId}`);
      return NextResponse.json(
        { error: "Failed to update patient" },
        { status: 500 }
      );
    }

    console.log(`API: Successfully updated patient ${patientId} status to ${statusToSet}`);
    return NextResponse.json({
      success: true,
      patientId: patientId,
      status: statusToSet,
      user: { hospitalId: result.rows[0].hopital_id }
    });
  } catch (error) {
    console.error("API Error updating patient status:", error);
    return NextResponse.json(
      { 
        error: "Failed to update patient status", 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}