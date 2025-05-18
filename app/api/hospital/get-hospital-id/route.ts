import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    console.log("Getting hospital ID for user:", userId);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Query the database to find the hospital ID by user ID
    const result = await db.execute(sql`
      SELECT id FROM hopitaux
      WHERE user_id = ${userId}
      LIMIT 1
    `);

    console.log("Hospital lookup result:", result.rows);

    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: "No hospital found for this user" },
        { status: 404 }
      );
    }

    const hospitalId = result.rows[0].id;
    return NextResponse.json({ hospitalId });
  } catch (error) {
    console.error("Error getting hospital ID:", error);
    let details = undefined;
    let stack = undefined;
    if (error instanceof Error) {
      details = error.message;
      stack = error.stack;
    }
    return NextResponse.json(
      { error: "Failed to retrieve hospital ID", details, stack },
      { status: 500 }
    );
  }
}