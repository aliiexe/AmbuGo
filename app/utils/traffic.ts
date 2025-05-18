/**
 * Utility functions for fetching traffic data from TomTom
 */

const TOMTOM_API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || '';

interface TrafficData {
  currentSpeed: number;
  freeFlowSpeed: number;
  confidence: number;
  roadClosure: boolean;
  frc: string; // Functional Road Class
}

/**
 * Get traffic flow data from TomTom for a specific point
 * 
 * @param latitude - Latitude of the point
 * @param longitude - Longitude of the point
 * @returns Traffic data including speeds and road conditions
 */
export const getTrafficFlow = async (latitude: number, longitude: number): Promise<TrafficData | null> => {
  try {
    if (!TOMTOM_API_KEY) {
      console.error('TomTom API key is not configured');
      return null;
    }

    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?key=${TOMTOM_API_KEY}&point=${latitude},${longitude}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch traffic data: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.flowSegmentData) {
      console.error('No traffic flow data available for this location');
      return null;
    }

    console.log("results of traffic flow", data.flowSegmentData);
    
    return {
      currentSpeed: data.flowSegmentData.currentSpeed,
      freeFlowSpeed: data.flowSegmentData.freeFlowSpeed,
      confidence: data.flowSegmentData.confidence,
      roadClosure: data.flowSegmentData.roadClosure || false,
      frc: data.flowSegmentData.frc
    };
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    return null;
  }
};

/**
 * Get traffic condition based on current and free flow speeds
 * 
 * @param currentSpeed - Current traffic speed
 * @param freeFlowSpeed - Free flow speed (ideal conditions)
 * @returns Traffic condition classification
 */
export const getTrafficCondition = (currentSpeed: number, freeFlowSpeed: number): {
  text: string;
  className: string;
} => {
  // Calculate ratio of current speed to free flow speed
  const ratio = currentSpeed / freeFlowSpeed;
  
  if (ratio >= 0.85) {
    return { text: "Clear", className: "text-green-600" };
  } else if (ratio >= 0.65) {
    return { text: "Minor Traffic", className: "text-yellow-600" };
  } else if (ratio >= 0.4) {
    return { text: "Moderate Traffic", className: "text-orange-600" };
  } else {
    return { text: "Heavy Traffic", className: "text-red-600" };
  }
}; 