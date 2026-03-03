
import { GoogleGenAI, Type } from "@google/genai";
import { Trip, Stop } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function optimizeRouteWithGemini(stops: Stop[], isTradeTrip: boolean) {
  const context = isTradeTrip ? "trader moving goods between markets" : "commuter navigating a daily route (school, office, etc.)";
  
  const prompt = `
    You are a route optimization engine for "Drop", a transport platform in Accra, Ghana.
    The user is a ${context}.
    Given these stops: ${stops.map(s => s.name).join(', ')}, provide:
    1. The most efficient order of visitation.
    2. Estimated total distance in km.
    3. Estimated total duration in minutes (considering Accra's specific traffic patterns).
    4. A "Pro Tip" specifically for this ${isTradeTrip ? 'trader' : 'commuter'} to save money or time.

    Return the response in valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            optimizedStopNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            totalDistanceKm: { type: Type.NUMBER },
            totalDurationMins: { type: Type.NUMBER },
            traderTip: { type: Type.STRING } // Keeping property name for backward compatibility
          },
          required: ["optimizedStopNames", "totalDistanceKm", "totalDurationMins", "traderTip"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini optimization failed:", error);
    return {
      optimizedStopNames: stops.map(s => s.name),
      totalDistanceKm: stops.length * 4.2,
      totalDurationMins: stops.length * 20,
      traderTip: isTradeTrip ? "Avoid Circle at midday." : "Leave 15 mins early to beat the school rush."
    };
  }
}
