import { GoogleGenAI, Type, FunctionDeclaration, Modality, Schema } from "@google/genai";
import { AspectRatio } from "../types";

// Helper to get AI instance safely
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- Image Generation ---
export const generateCardImage = async (prompt: string, aspectRatio: AspectRatio = AspectRatio.SQUARE) => {
  const ai = getAI();
  // Using gemini-3-pro-image-preview for high quality card art
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: '1K'
      }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// --- Chat & Search & Maps ---
export const sendChatMessage = async (
  message: string,
  modelId: string,
  history: any[] = [],
  useSearch: boolean = false,
  useMaps: boolean = false,
  useThinking: boolean = false,
  currentLocation?: { lat: number, lng: number }
) => {
  const ai = getAI();
  
  let tools: any[] = [];
  let toolConfig: any = undefined;

  if (useSearch) {
    tools.push({ googleSearch: {} });
  }
  if (useMaps) {
    tools.push({ googleMaps: {} });
    if (currentLocation) {
      toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng
          }
        }
      };
    }
  }

  let thinkingConfig = undefined;
  let maxOutputTokens = undefined;

  if (useThinking) {
    // Thinking mode requires specific budget and NO maxOutputTokens usually, 
    // but the SDK allows managing the budget.
    thinkingConfig = { thinkingBudget: 32768 };
  }

  // Choose model based on feature if strictly required, otherwise rely on passed modelId
  // Maps ONLY works on 2.5 flash.
  const effectiveModelId = useMaps ? 'gemini-2.5-flash' : modelId;

  const chat = ai.chats.create({
    model: effectiveModelId,
    history: history,
    config: {
      tools: tools.length > 0 ? tools : undefined,
      toolConfig: toolConfig,
      thinkingConfig: thinkingConfig,
    }
  });

  const response = await chat.sendMessage({ message });
  
  const text = response.text || "I couldn't generate a text response.";
  
  // Extract grounding info
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = chunks.map((c: any) => {
    if (c.web) return { uri: c.web.uri, title: c.web.title };
    if (c.maps) return { uri: c.maps.uri, title: c.maps.title };
    return null;
  }).filter(Boolean);

  return { text, sources };
};

// --- Fast AI Response (Lite) ---
export const getFastResponse = async (prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-flash-lite-latest', // Maps to 2.5 Flash Lite
    contents: prompt,
  });
  return response.text;
};

// --- TTS ---
export const generateSpeech = async (text: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });
  
  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio;
};

// --- Media Analysis (Image/Video) ---
export const analyzeMedia = async (
  prompt: string, 
  mediaData: string, 
  mimeType: string, 
  isVideo: boolean = false
) => {
  const ai = getAI();
  const model = 'gemini-3-pro-preview'; // Used for both image and video understanding per requirements

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            data: mediaData,
            mimeType: mimeType
          }
        },
        { text: prompt }
      ]
    }
  });

  return response.text;
};

// --- Audio Transcription ---
export const transcribeAudio = async (base64Audio: string, mimeType: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', // Required for audio transcription
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Audio,
            mimeType: mimeType
          }
        },
        { text: "Transcribe this audio exactly as spoken." }
      ]
    }
  });
  return response.text;
};
