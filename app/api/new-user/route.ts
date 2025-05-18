import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/app/db";
import { ambulancesTable, hopitauxTable } from "@/app/db/schema";
import { Roles } from "@/types/globals";

export async function GET(request: Request) {
  const authObj = await auth();
  const userId = authObj.userId;
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  try {
    const user = await currentUser();
    
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }
    
    // check if user already has a role
    const role = authObj.sessionClaims?.metadata?.role as Roles | undefined;
    
    if (role) {
      // user already has a role, redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    
    // user needs to register, redirect to registration page
    return NextResponse.redirect(new URL("/register", request.url));
  } catch (error: any) {
    console.error("Error processing user:", error);
    return new NextResponse("Error processing user", { status: 500 });
  }
}

export async function POST(request: Request) {
  const authObj = await auth();
  const userId = authObj.userId;
  
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  
  try {
    const data = await request.json();
    const { role, ...userData } = data;
    
    // validate role
    if (role !== 'ambulance' && role !== 'hopital') {
      return new NextResponse("Invalid role", { status: 400 });
    }
    
    // update user metadata in Clerk
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: {
        role
      }
    });
    
    // insert user data into appropriate table
    if (role === 'ambulance') {
      const { numero_plaque, nom_conducteur, capacite } = userData;
      
      await db.insert(ambulancesTable).values({
        user_id: userId,
        numero_plaque,
        nom_conducteur,
        etat: 'Disponible',
        capacite: parseInt(capacite)
      });
    } else if (role === 'hopital') {
      const { 
        nom, 
        adresse, 
        latitude, 
        longitude, 
        capacite_totale, 
        lits_disponibles,
        numero_contact
      } = userData;
      
      await db.insert(hopitauxTable).values({
        user_id: userId,
        nom,
        adresse,
        latitude,
        longitude,
        capacite_totale: parseInt(capacite_totale),
        lits_disponibles: parseInt(lits_disponibles),
        numero_contact
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error saving user data:", error);
    return new NextResponse(error.message || "Error saving user data", { status: 500 });
  }
}