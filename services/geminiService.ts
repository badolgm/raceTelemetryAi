import { GoogleGenAI, Type } from "@google/genai";
import { LapData, Track, AIAnalysis } from '../types';

// Vite expone variables como import.meta.env.VITE_*
// En el navegador no existe process.env, y usarlo causa "process is not defined".
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallSummary: {
            type: Type.STRING,
            description: "A brief, encouraging summary of the lap performance, highlighting one key strength."
        },
        areasForImprovement: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 2-3 strings describing specific areas of weakness (e.g., 'Inconsistent throttle application in slow corners', 'Braking too early for the hairpin')."
        },
        detailedRecommendations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    location: {
                        type: Type.STRING,
                        description: "The specific location on the track for the recommendation (e.g., 'Turn 3', 'Exit of the chicane')."
                    },
                    advice: {
                        type: Type.STRING,
                        description: "A concrete, actionable piece of advice for the driver at that location."
                    }
                },
                required: ["location", "advice"]
            },
            description: "An array of 2-3 specific, high-impact recommendations for different parts of the track."
        }
    },
    required: ["overallSummary", "areasForImprovement", "detailedRecommendations"]
};

const generateAnalysisPrompt = (lapData: LapData, track: Track): string => {
  // Sample the data to keep the prompt concise
  const sampledTelemetry = lapData.telemetry.filter((_, index) => index % Math.floor(lapData.telemetry.length / 100) === 0);

  const prompt = `
You are a world-class race engineer and driving coach for the TGRNA GR CUP NORTH AMERICA series.
Your task is to analyze the following telemetry data from a lap around ${track.name} and provide actionable feedback.
The driver wants concise, high-impact advice to get faster.

Telemetry Data Summary:
- Lap Time: ${lapData.lapTime}
- Track Length: ${track.lapDistance} meters
- Data Points: A sample of ${sampledTelemetry.length} telemetry readings from the lap.

Sampled Data:
${JSON.stringify(sampledTelemetry, null, 2)}

Please provide your analysis in a valid JSON format according to the provided schema. The analysis should be sharp, insightful, and directly applicable for a driver looking to improve their times.
Focus on the most critical areas for improvement.
`;
  return prompt;
};

export const analyzeLapData = async (lapData: LapData, track: Track): Promise<AIAnalysis> => {
    try {
        if (!API_KEY) {
            throw new Error("Falta VITE_API_KEY. Define VITE_API_KEY en tu entorno.");
        }

        // Inicializar el cliente justo antes de usarlo, con validación de API key
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const prompt = generateAnalysisPrompt(lapData, track);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0.5,
            }
        });

        const jsonText = response.text.trim();
        const analysisResult = JSON.parse(jsonText);
        return analysisResult as AIAnalysis;

    } catch (error) {
        console.error("Error analyzing lap data with Gemini:", error);
        throw new Error("Failed to get analysis from AI. Please check the console for details.");
    }
};