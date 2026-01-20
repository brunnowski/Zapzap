
import { GoogleGenAI, Type } from "@google/genai";
import { Message } from "../types";

const getApiKey = () =>
  import.meta.env.VITE_GEMINI_API_KEY ||
  import.meta.env.VITE_API_KEY ||
  "";

let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (ai) return ai;
  const apiKey = getApiKey();
  if (!apiKey) return null;
  ai = new GoogleGenAI({ apiKey });
  return ai;
};

export const analyzeChatHistory = async (messages: Message[]) => {
  const client = getAiClient();
  if (!client) {
    console.warn("Gemini API key missing. Set VITE_GEMINI_API_KEY to enable insights.");
    return null;
  }
  // We take a sample of messages to avoid token limits while still getting the vibe
  const sample = messages
    .slice(-100)
    .map(m => `${m.sender}: ${m.content}`)
    .join('\n');

  const response = await client.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this chat history between two lovers and provide a JSON summary.
    Chat sample:
    ${sample}
    
    Focus on:
    - Overall relationship sentiment
    - Common themes or inside jokes
    - Key milestones mentioned
    - Funny quirks in their communication`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: { type: Type.STRING },
          themes: { type: Type.ARRAY, items: { type: Type.STRING } },
          milestones: { type: Type.ARRAY, items: { type: Type.STRING } },
          advice: { type: Type.STRING, description: "Relationship advice based on the chat vibe" }
        },
        required: ["sentiment", "themes", "milestones", "advice"]
      }
    }
  });

  try {
    // Access .text property directly (not a method)
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return null;
  }
};
