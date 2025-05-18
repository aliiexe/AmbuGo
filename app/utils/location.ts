/**
 * Gets the user's current geolocation
 * @returns Promise with latitude and longitude
 */
export function getCurrentLocation(): Promise<{latitude: number, longitude: number}> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        }
      );
    }
  });
}

/**
 * Fetches nearest hospitals based on user's location
 * @param latitude User's latitude
 * @param longitude User's longitude
 * @param limit Number of hospitals to return
 * @returns Promise with nearest hospitals data
 */
export async function fetchNearestHospitals(
  latitude: number,
  longitude: number,
  limit: number = 5
) {
  try {
    const response = await fetch(
      `/api/nearest-hospitals?latitude=${latitude}&longitude=${longitude}&limit=${limit}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch nearest hospitals');
    }
    
    const data = await response.json();
    return data.hospitals;
  } catch (error) {
    console.error('Error fetching nearest hospitals:', error);
    throw error;
  }
}