// api/hospital-recommendations/route.ts
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/app/db";
import { hopitauxTable, medecinsTable, equipementsMedicauxTable, medicamentsTable } from "@/app/db/schema";
import { eq, sql } from "drizzle-orm";
import { getTrafficFlow, getTrafficCondition } from "@/app/utils/traffic";

const openai = new OpenAI();

// Define the schema for hospital recommendations
const HospitalRecommendation = z.object({
  hospital_id: z.string(),
  hospital_name: z.string(),
  comment: z.string(),
  recommendation_score: z.number(),
});

const RecommendationOutput = z.object({
  recommendations: z.array(HospitalRecommendation),
});

// Define types for our data structures
interface Doctor {
  name: string;
  specialty: string;
}

interface Hospital {
  id: string;
  name: string;
  hasEmergencyBlock: boolean;
  doctors?: Doctor[];
  equipment?: string[];
  medications?: string[];
  trafficCondition: string;
  latitude?: string | null;
  longitude?: string | null;
  distance?: number;
  adresse?: string | null;
  capacite_totale?: number | null;
  lits_disponibles?: number | null;
  numero_contact?: string | null;
}

interface PatientData {
  isUrgent: boolean;
  condition?: string;
  requiredEquipment?: string[];
  age?: number;
  requiredMedications?: string[];
  latitude?: number;
  longitude?: number;
}

// System prompt for the hospital recommendation AI
const systemPrompt = `
You are an expert hospital recommendation system for ambulance dispatch services.

Your primary responsibility is to analyze available hospital data and patient requirements to recommend the most suitable hospitals for emergency services.

The input data will be provided as a structured text in French with sections for patient information and multiple hospitals.

You need to parse this structured text to extract:

1. Patient information:
   - Whether the case is urgent ("Demande une attention immédiate" indicates urgency)
   - Required medical equipment or facilities (after "Nécessite:")
   - Required specialists (if mentioned)
   - Required medications (if mentioned)
   - Patient age and condition severity

2. Hospital information:
   - Hospital ID and name
   - Availability of emergency blocks ("Block d'urgence disponible")
   - Available doctors and their specialties
   - Available medical equipment
   - Available medications
   - Traffic conditions to the hospital

Follow these detailed criteria when making recommendations:

1. URGENT CASES: If the case is urgent, prioritize hospitals with available emergency blocks.
2. EQUIPMENT MATCH: If the patient needs specific equipment (like "Salle d'opération"), only recommend hospitals that have that equipment.
3. SPECIALIST MATCH: If the patient needs a specific type of specialist (like "Cardiologue"), prioritize hospitals with that specialist available.
4. MEDICATION MATCH: If the patient needs specific medications, consider their availability at the hospitals.
5. TRAFFIC CONDITIONS: Consider traffic conditions to the hospital - prefer hospitals with "léger" (light) traffic over "modéré" (moderate) or "dense" (heavy) traffic.
6. AGE APPROPRIATENESS: For children, prioritize children's hospitals if available.

Scoring methodology:
- Start with a base score of 60 for all hospitals
- For urgent cases: +30 if emergency block available, -50 if not available
- For required equipment: +15 for each required equipment available, -40 for any missing critical equipment
- For required specialists: +20 if required specialist available, -30 if not available when needed
- For required medications: +10 for each required medication available, -20 for any missing critical medication
- Traffic adjustment: +10 for light traffic, 0 for moderate traffic, -15 for heavy traffic
- Age appropriateness: +15 if the hospital is appropriate for the patient's age group

Always provide 1-3 hospital recommendations sorted by score, with detailed justification for each recommendation in French.

If a patient case doesn't specify certain criteria (equipment, specialist, medications), do not factor those into the scoring.

Your recommendations must include the hospital's ID and name exactly as provided in the input data, and should help emergency services make quick, informed decisions about where to transport patients.
`;

// Helper function to translate traffic condition to French
function translateTrafficCondition(condition: string): string {
  switch (condition) {
    case "Clear":
      return "léger";
    case "Minor Traffic":
      return "léger";
    case "Moderate Traffic":
      return "modéré";
    case "Heavy Traffic":
      return "dense";
    default:
      return "modéré";
  }
}

export async function POST(request: Request) {
  try {
    const requestData = await request.json();
    const { patientData } = requestData;

    if (!patientData) {
      return NextResponse.json(
        { error: "Invalid input data format" },
        { status: 400 }
      );
    }

    // Validate patient coordinates
    if (!patientData.latitude || !patientData.longitude || 
        isNaN(patientData.latitude) || isNaN(patientData.longitude)) {
      return NextResponse.json(
        { error: "Valid patient latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Find the 4 nearest hospitals using the Haversine formula
    const nearestHospitalsResult = await db.execute(sql`
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
            cos(radians(${patientData.latitude})) * 
            cos(radians(cast(latitude as float))) * 
            cos(radians(cast(longitude as float)) - 
            radians(${patientData.longitude})) + 
            sin(radians(${patientData.latitude})) * 
            sin(radians(cast(latitude as float)))
          )
        ) AS distance
      FROM hopitaux
      ORDER BY distance
      LIMIT 4
    `);

    const nearestHospitals = nearestHospitalsResult.rows || [];
    
    console.log("Nearest hospitals: ", nearestHospitals);
    
    if (!nearestHospitals || nearestHospitals.length === 0) {
      return NextResponse.json(
        { error: "No hospitals found in database" },
        { status: 404 }
      );
    }

    // Process each hospital to get complete data
    const processedHospitals: Hospital[] = await Promise.all(
      nearestHospitals.map(async (hospital: any) => {
        // Fetch doctors for this hospital
        const doctors = await db
          .select()
          .from(medecinsTable)
          .where(eq(medecinsTable.hopital_id, hospital.id));

        // Fetch equipment for this hospital
        const equipment = await db
          .select()
          .from(equipementsMedicauxTable)
          .where(eq(equipementsMedicauxTable.hopital_id, hospital.id));

        // Fetch medications for this hospital
        const medications = await db
          .select()
          .from(medicamentsTable)
          .where(eq(medicamentsTable.hopital_id, hospital.id));

        // Get traffic data if coordinates are available
        let trafficCondition = "modéré"; // Default
        if (hospital.latitude && hospital.longitude) {
          try {
            // Calculate mid-point between patient and hospital for better traffic estimation
            const patientLat = patientData.latitude;
            const patientLng = patientData.longitude;
            const hospitalLat = parseFloat(hospital.latitude);
            const hospitalLng = parseFloat(hospital.longitude);
            
            // Calculate midpoint
            const midLat = (patientLat + hospitalLat) / 2;
            const midLng = (patientLng + hospitalLng) / 2;
            
            const trafficData = await getTrafficFlow(midLat, midLng);
            
            if (trafficData) {
              const condition = getTrafficCondition(
                trafficData.currentSpeed, 
                trafficData.freeFlowSpeed
              );
              trafficCondition = translateTrafficCondition(condition.text);
            }
          } catch (error) {
            console.error("Error getting traffic data:", error);
          }
        }

        // Determine if hospital has emergency blocks
        // This is a placeholder - you would fetch this from your actual database
        const hasEmergencyBlock = Math.random() > 0.3; // For demo

        return {
          id: hospital.id,
          name: hospital.nom || "Unknown Hospital",
          hasEmergencyBlock,
          doctors: doctors.map(doctor => ({
            name: doctor.nom || "Unknown Doctor",
            specialty: doctor.specialite || "General"
          })),
          equipment: equipment.map(eq => eq.nom),
          medications: medications.map(med => med.nom),
          trafficCondition,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          distance: hospital.distance,
          adresse: hospital.adresse,
          capacite_totale: hospital.capacite_totale,
          lits_disponibles: hospital.lits_disponibles,
          numero_contact: hospital.numero_contact
        };
      })
    );

    // Format the input similar to the Python example
    const formattedInput = formatInputData(patientData as PatientData, processedHospitals);

    // Call OpenAI API
    const response = await openai.responses.parse({
      model: "gpt-4.1-nano",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: formattedInput },
      ],
      text: {
        format: zodTextFormat(RecommendationOutput, "recommendations"),
      },
    });
    
    console.log("AI response: ", response.output_parsed);

    // Return the recommendations with proper null checking
    if (!response.output_parsed) {
      return NextResponse.json({
        error: "Failed to parse hospital recommendations",
        recommendations: []
      }, { status: 500 });
    }

    // Include all hospital data in the final recommendations
    const enhancedRecommendations = response.output_parsed.recommendations.map(rec => {
      const hospital = processedHospitals.find(h => h.id === rec.hospital_id);
      return {
        ...rec,
        hospital_details: {
          distance: hospital?.distance || null,
          adresse: hospital?.adresse || "Address unavailable",
          capacite_totale: hospital?.capacite_totale || 100,
          lits_disponibles: hospital?.lits_disponibles || 30,
          numero_contact: hospital?.numero_contact || "Contact unavailable",
          latitude: hospital?.latitude || "0",
          longitude: hospital?.longitude || "0",
          doctors: hospital?.doctors || [],
          equipment: hospital?.equipment || [],
          medications: hospital?.medications || [],
          trafficCondition: hospital?.trafficCondition || "modéré"
        }
      };
    });

    return NextResponse.json({
      recommendations: enhancedRecommendations,
    });
  } catch (error) {
    console.error("Error processing hospital recommendations:", error);
    return NextResponse.json(
      { error: "Failed to process hospital recommendations" },
      { status: 500 }
    );
  }
}

// Helper function to format input data
function formatInputData(patientData: PatientData, hospitalData: Hospital[]): string {
  // Format patient data
  let formattedInput = `* Données du Patient:\n`;
  
  if (patientData.isUrgent) {
    formattedInput += `- Demande une attention immédiate\n`;
  }
  
  if (patientData.condition) {
    formattedInput += `- ${patientData.condition}\n`;
  }
  
  if (patientData.requiredEquipment && patientData.requiredEquipment.length > 0) {
    formattedInput += `- Nécessite: ${patientData.requiredEquipment.join(', ')}\n`;
  }
  
  if (patientData.age) {
    formattedInput += `- Age Estimé: ${patientData.age} ans\n`;
  }
  
  if (patientData.requiredMedications && patientData.requiredMedications.length > 0) {
    formattedInput += `- Médicaments nécessaires: ${patientData.requiredMedications.join(', ')}\n`;
  }
  
  formattedInput += '\n';
  
  // Format hospital data
  hospitalData.forEach((hospital, index) => {
    formattedInput += `* Hopital ${index + 1}: \n`;
    formattedInput += `- hospital_id: ${hospital.id}\n`;
    formattedInput += `- hospital_name: ${hospital.name}\n`;
    formattedInput += `- Block d'urgence ${hospital.hasEmergencyBlock ? 'disponible' : 'non disponible'}\n`;
    
    if (hospital.doctors && hospital.doctors.length > 0) {
      formattedInput += `- Docteurs disponibles: ${hospital.doctors.map((doctor: Doctor) => `${doctor.name} - ${doctor.specialty}`).join(', ')}\n`;
    }
    
    if (hospital.equipment && hospital.equipment.length > 0) {
      formattedInput += `- Equipements Medicales: ${hospital.equipment.join(', ')}\n`;
    }
    
    if (hospital.medications && hospital.medications.length > 0) {
      formattedInput += `- Médicaments: ${hospital.medications.join(', ')}\n`;
    }
    
    formattedInput += `- Traffic vers l'hopital ${hospital.trafficCondition}\n`;
    
    if (hospital.distance !== undefined) {
      formattedInput += `- Distance: ${hospital.distance.toFixed(2)} km\n`;
    }
    
    formattedInput += '\n';
  });
  
  return formattedInput;
}