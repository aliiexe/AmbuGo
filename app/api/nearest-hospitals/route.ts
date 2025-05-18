import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/db";
import { sql } from 'drizzle-orm';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get user coordinates from query parameters
    const userLatitude = parseFloat(searchParams.get('latitude') || '');
    const userLongitude = parseFloat(searchParams.get('longitude') || '');
    const limit = parseInt(searchParams.get('limit') || '5');

    // Validate coordinates
    if (isNaN(userLatitude) || isNaN(userLongitude)) {
      return NextResponse.json(
        { error: "Valid latitude and longitude parameters are required" },
        { status: 400 }
      );
    }

    // Find nearest hospitals
    const result = await db.execute(sql`
        SELECT 
          id, 
          nom, 
          adresse, 
          latitude, 
          longitude, 
          capacite_totale, 
          lits_disponibles,
          numero_contact,
          (
            6371 * acos(
              cos(radians(${userLatitude})) * 
              cos(radians(cast(latitude as float))) * 
              cos(radians(cast(longitude as float)) - 
              radians(${userLongitude})) + 
              sin(radians(${userLatitude})) * 
              sin(radians(cast(latitude as float)))
            )
          ) AS distance
        FROM hopitaux
        ORDER BY distance
      `);
    
    const hospitals = result.rows || [];

    return NextResponse.json({
      hospitals,
    });
  } catch (error) {
    console.error("Error finding nearest hospitals:", error);
    return NextResponse.json(
      { error: "Failed to find nearest hospitals" },
      { status: 500 }
    );
  }
}