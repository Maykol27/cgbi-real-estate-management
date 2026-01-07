import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Use Gemini 3 Pro for complex chat interactions
export const sendMessageToGemini = async (
  message: string,
  history: ChatMessage[]
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are a helpful real estate assistant for CGBI. You help administrators, owners, and tenants with property management questions. Be professional, concise, and friendly.",
      },
    });

    // Note: In a real app, we would sync the full history to the chat session. 
    // For this stateless service example, we assume single turn or manage history externally if needed,
    // but the SDK handles history if we keep the 'chat' instance alive. 
    // Here we just send the new message for simplicity in this demo structure.
    
    const result = await chat.sendMessage({ message });
    return result.text || "Lo siento, no pude procesar tu solicitud.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Hubo un error al conectar con el asistente.";
  }
};

// Use Gemini 2.5 Flash Lite for fast, low-latency summaries
export const generateQuickSummary = async (dataContext: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite-latest', // Explicitly using Flash Lite for speed
      contents: `Summarize the following data into 2-3 key insights efficiently in Spanish:\n\n${dataContext}`,
      config: {
        temperature: 0.3,
      }
    });
    return response.text || "No se pudo generar el resumen.";
  } catch (error) {
    console.error("Gemini Flash Lite Error:", error);
    return "Error generando resumen.";
  }
};