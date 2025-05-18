'use client';

import { useState, useEffect } from 'react';
import { getCurrentLocation, fetchNearestHospitals } from '@/app/utils/location';

export default function NearestHospitals() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findNearbyHospitals = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get user's current location
      const location = await getCurrentLocation();
      
      // Fetch nearest hospitals
      const nearestHospitals = await fetchNearestHospitals(
        location.latitude,
        location.longitude
      );
      
      setHospitals(nearestHospitals);
    } catch (err: any) {
      setError(err.message || 'Failed to find nearby hospitals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Nearest Hospitals</h2>
      
      <button
        onClick={findNearbyHospitals}
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Find Nearby Hospitals'}
      </button>
      
      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}
      
      {hospitals.length > 0 ? (
        <div className="space-y-4">
          {hospitals.map((hospital) => (
            <div key={hospital.id} className="border rounded p-4">
              <h3 className="font-bold text-lg">{hospital.nom}</h3>
              <p className="text-gray-600">{hospital.adresse}</p>
              <p className="mt-2">
                Distance: {hospital.distance.toFixed(2)} km
              </p>
              <p>
                Available Beds: {hospital.lits_disponibles}/{hospital.capacite_totale}
              </p>
              <p>Contact: {hospital.numero_contact}</p>
            </div>
          ))}
        </div>
      ) : (
        !loading && !error && (
          <p>Click the button to find hospitals near you.</p>
        )
      )}
    </div>
  );
}