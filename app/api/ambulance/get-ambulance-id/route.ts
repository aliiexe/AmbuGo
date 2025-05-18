import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Query the database to find the ambulance ID by user ID
    const result = await db.execute(sql`
      SELECT id FROM ambulances
      WHERE user_id = ${userId}
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      // If no ambulance found for this user, return an error
      return NextResponse.json(
        { error: "No ambulance found for this user" },
        { status: 404 }
      );
    }

    const ambulanceId = result.rows[0].id;

    return NextResponse.json({ ambulanceId });
  } catch (error) {
    console.error("Error getting ambulance ID:", error);
    return NextResponse.json(
      { error: "Failed to retrieve ambulance ID" },
      { status: 500 }
    );
  }
}