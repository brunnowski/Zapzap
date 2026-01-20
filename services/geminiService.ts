
import { GoogleGenAI, Type } from "@google/genai";
import { Message } from "../types";

// Fix: Always use named parameter and process.env.API_KEY directly as per SDK guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeChatHistory = async (messages: Message[]) => {
  // We take a sample of messages to avoid token limits while still getting the vibe
  const sample = messages
    .slice(-100)
    .map(m => `${m.sender}: ${m.content}`)
    .join('\n');

  const response = await ai.models.generateContent({
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
