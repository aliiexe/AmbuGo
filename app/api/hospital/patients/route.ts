import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    console.log("API: Received request for patients data");
    
    const url = new URL(request.url);
    const hospitalId = url.searchParams.get("hospitalId");

    console.log(`API: Parameter - hospitalId: ${hospitalId}`);

    if (!hospitalId) {
      console.log("API: Missing hospitalId parameter");
      return NextResponse.json(
        { error: "Hospital ID is required" },
        { status: 400 }
      );
    }

    try {
      // Test DB connection first
      const testQuery = await db.execute(sql`SELECT 1 as test`);
      console.log("Database connection test:", testQuery.rows);
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { 
          error: "Database connection failed", 
          details: dbError instanceof Error ? dbError.message : String(dbError) 
        },
        { status: 500 }
      );
    }

    // Log the actual query we're about to run
    console.log(`API: Query for hospital ID: ${hospitalId}`);

    // Fetch all patients for this hospital
    const patientsQuery = sql`
      SELECT 
        id, 
        nom as name, 
        age,
        COALESCE(dossier_medical->>'gender', 'Unknown') as gender,
        COALESCE(dossier_medical->>'symptoms', 'No symptoms recorded') as symptoms,
        COALESCE(dossier_medical->>'serviceType', 'General') as "serviceType",
        COALESCE((dossier_medical->>'isEmergency')::boolean, false) as "isEmergency",
        COALESCE((dossier_medical->>'requiresImmediate')::boolean, false) as "requiresImmediate",
        COALESCE(dossier_medical->>'status', 'en-route') as status,
        '10 min' as eta,
        to_char(CURRENT_TIMESTAMP, 'HH24:MI') || ' (recently)' as "arrivalTime"
      FROM patients
      WHERE 
        hopital_id = ${hospitalId}::uuid
    `;

    console.log("API: Executing database query");
    const result = await db.execute(patientsQuery);
    console.log(`API: Query returned ${result.rows?.length || 0} patients`);

    return NextResponse.json({
      patients: result.rows || []
    });
  } catch (error) {
    console.error("API Error fetching patients:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch patients", 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}