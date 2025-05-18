from openai import OpenAI
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List

load_dotenv()

client = OpenAI()

class HospitalRecommendation(BaseModel):
    hospital_id: str = Field(description="The ID of the recommended hospital as given in the data")
    hospital_name: str = Field(description="The name of the recommended hospital as given in the data")
    comment: str = Field(description="Detailed justification for why this hospital is recommended")
    recommendation_score: int = Field(description="Recommendation score (0-100) based on matching criteria")

class RecommendationOutput(BaseModel):
    recommendations: List[HospitalRecommendation] = Field(description="List of recommended hospitals in order of priority")


prompt = """
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
"""


user_input = """
* Données du Patient:
- Demande une attention immédiate
- Gravement blessé dans un accident de voiture
- Nécessite: Salle d'opération, Radiographie
- Age Estimé: 8 ans
- Médicaments nécessaires: Analgésiques, Antibiotiques

* Hopital 1: 
- hospital_id: 07ee7663
- hospital_name: Hôpital d'enfants
- Block d'urgence disponible
- Docteurs disponibles: Dr. Dupont - Cardiologue, Dr. Martin - Chirurgien, Dr. Petit - Orthopédiste
- Equipements Medicales: Radiographie, Scanner, IRM
- Médicaments: Antibiotiques, Analgésiques, Anticoagulants
- Traffic vers l'hopital modéré

* Hopital 2:
- hospital_id: 12ab45cd
- hospital_name: Clinique Centrale
- Block d'urgence non disponible
- Docteurs disponibles: Dr. Laurent - Chirurgien, Dr. Bernard - Généraliste
- Equipements Medicales: Scanner, IRM
- Médicaments: Analgésiques, Antibiotiques, Antiseptiques
- Traffic vers l'hopital léger

* Hopital 3:
- hospital_id: 89ef34gh
- hospital_name: Hôpital Universitaire
- Block d'urgence disponible
- Docteurs disponibles: Dr. Thomas - Urgentiste, Dr. Richard - Neurologue
- Equipements Medicales: Radiographie, Scanner, IRM, Échographie
- Médicaments: Analgésiques, Sédatifs, Anticoagulants
- Traffic vers l'hopital dense

* Hopital 4:
- hospital_id: 56ij78kl
- hospital_name: Centre Médical Régional
- Block d'urgence disponible
- Docteurs disponibles: Dr. Moreau - Orthopédiste, Dr. Dubois - Chirurgien, Dr. Roy - Pédiatre
- Equipements Medicales: Radiographie, IRM
- Médicaments: Antibiotiques, Analgésiques, Antihistaminiques
- Traffic vers l'hopital modéré
"""

response = client.responses.parse(
    model="gpt-4.1-nano",
    input=[
        {
            "role": "system",
            "content": prompt
        },
        {
            "role": "user",
            "content": user_input,
        },
    ],
    text_format=RecommendationOutput,
)

print(response.output_parsed)