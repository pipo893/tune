
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ComprehensionContent, GrammarCorrection, WordInfo } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getWordInfo = async (word: string): Promise<WordInfo> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Provide a detailed analysis of the English word: "${word}".`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          definition: { type: Type.STRING },
          example: { type: Type.STRING },
          synonyms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          antonyms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ['word', 'definition', 'example', 'synonyms', 'antonyms'],
      },
    },
  });
  
  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

export const textToSpeech = async (text: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this clearly: ${text}` }] }],
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
    if (!base64Audio) {
        throw new Error("No audio data received from API.");
    }
    return base64Audio;
};

export const generateReadingContent = async (): Promise<ComprehensionContent> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: "Generate a short, interesting story for an intermediate English learner (about 150-200 words). After the story, create 3 multiple-choice questions about it, each with 4 options. Indicate the correct answer for each question.",
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          story: { type: Type.STRING, description: "The short story for the user to read." },
          questions: {
            type: Type.ARRAY,
            description: "A list of multiple-choice questions about the story.",
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING, description: "The exact text of the correct option." }
              },
              required: ['question', 'options', 'correctAnswer']
            }
          }
        },
        required: ['story', 'questions']
      }
    }
  });

  const jsonText = response.text.trim();
  return JSON.parse(jsonText);
};

export const checkGrammar = async (text: string): Promise<GrammarCorrection> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Analyze the following text for grammar and spelling errors. Provide a corrected version and a list of explanations for the changes made. Text: "${text}"`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    correctedText: { type: Type.STRING },
                    explanations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                original: { type: Type.STRING },
                                correction: { type: Type.STRING },
                                reason: { type: Type.STRING }
                            },
                            required: ['original', 'correction', 'reason']
                        }
                    }
                },
                required: ['correctedText', 'explanations']
            }
        }
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
