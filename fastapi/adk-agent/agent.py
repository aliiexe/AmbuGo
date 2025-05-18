from google.adk.agents import LlmAgent
from google.adk.models.lite_llm import LiteLlm
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
import os
import json
from typing import List
from pydantic import BaseModel, Field
from dotenv import load_dotenv
load_dotenv()


# Define schemas for hospital recommendation
class RecommendationInput(BaseModel):
    data: str = Field(description="Structured text containing patient information and hospital data")

class HospitalRecommendation(BaseModel):
    hospital_id: str = Field(description="The ID of the recommended hospital as given in the data")
    hospital_name: str = Field(description="The name of the recommended hospital as given in the data")
    comment: str = Field(description="Detailed justification for why this hospital is recommended")
    recommendation_score: int = Field(description="Recommendation score (0-100) based on matching criteria")

class RecommendationOutput(BaseModel):
    recommendations: List[HospitalRecommendation] = Field(description="List of recommended hospitals in order of priority")

# Constants for session management
APP_NAME = "hospital_recommendation_app"
USER_ID = "test_user_123"
SESSION_ID = "hospital_recommendation_session"

# Create the hospital recommendation agent
agent = LlmAgent(
    name="hospital_recommendation_agent",
    description="Expert hospital recommendation system for ambulance dispatch services",
    instruction="""
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

IMPORTANT: Your response MUST be valid JSON matching this structure:
{
    "recommendations": [
        {
            "hospital_id": "hospital_id",
            "hospital_name": "hospital_name",
            "comment": "comment",
            "recommendation_score": 75
        }
    ]
}

DO NOT include any explanations or additional text outside the JSON response.
DO NOT use quotes for number values like recommendation_score.
ENSURE all keys and format match exactly this structure.
""",
    model=LiteLlm(
        model="gpt-4.1-nano",
        api_key=os.getenv("OPENAI_API_KEY"),
    ),
    output_schema=RecommendationOutput,
    output_key="hospital_recommendations",
    # Explicitly set transfer configuration to prevent warning
    disallow_transfer_to_parent=True,
    disallow_transfer_to_peers=True,
)

# Set up session management and runner
session_service = InMemorySessionService()
session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)

runner = Runner(
    agent=agent,
    app_name=APP_NAME,
    session_service=session_service
)

def create_sample_data():
    """Create sample hospital data for testing the recommendation agent."""
    return """
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

# Function to call the agent and get results
async def get_hospital_recommendations(patient_data: str):
    """Call the hospital recommendation agent with patient data and return results."""
    print(f"\n>>> Calling Hospital Recommendation Agent")
    
    # Process input data
    input_data = {
        "data": patient_data
    }
    
    # Create input in the expected format
    user_content = types.Content(
        role='user', 
        parts=[types.Part(text=json.dumps(input_data))]
    )
    
    # Call the agent
    final_response = None
    async for event in runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=user_content):
        if event.is_final_response() and event.content and event.content.parts:
            final_response = event.content.parts[0].text
            print(f"Agent response: {final_response}")  # Print beginning of response
    
    # Get the structured recommendations from session state
    current_session = session_service.get_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
    recommendations = current_session.state.get("hospital_recommendations")
    
    if not recommendations:
        print("No recommendations found in session state")
        print("Trying to parse final response as JSON")
        try:
            response_json = json.loads(final_response)
            recommendations = response_json.get("recommendations", [])
        except Exception as e:
            print(f"Error parsing response: {e}")
            print(f"Raw response: {final_response}")
    
    return recommendations

# Main function to demonstrate usage
async def main():
    sample_data = create_sample_data()
    recommendations = await get_hospital_recommendations(sample_data)
    print("\n--- Hospital Recommendations ---")
    return recommendations

# Usage:
if __name__ == "__main__":
    import asyncio
    recommendations = asyncio.run(main())