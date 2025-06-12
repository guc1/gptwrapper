import { GoogleGenAI, type GenerationConfig, type SafetySetting } from '@google/genai';

/* ------------------------------------------------------------------ */
/* 0. Bootstrapping                                                   */
/* ------------------------------------------------------------------ */
const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY ?? '',
  // For Vertex AI replace with { projectId, location }
});

const MODEL_BASE = 'gemini-2.5-flash-preview-05-20';
const MODEL_THINKING_ID = `${MODEL_BASE}:thinking`;

/**
 * Retrieve a handle to the Gemini model.
 * @param useThinking Enable reasoning by switching to the :thinking variant.
 * @returns Gemini GenerativeModel instance.
 */
export function getModel(useThinking = false) {
  const modelId = useThinking ? MODEL_THINKING_ID : MODEL_BASE;
  return genAI.getGenerativeModel({ model: modelId });
}

/** Default generation options mirroring Google defaults.
 *  - temperature: 0–2 randomness
 *  - topP:       0–1 nucleus sampling cut-off
 *  - topK:       1–40 token shortlist size
 *  - maxOutputTokens: ≤65_536 for 05-20
 *  - thinkingBudget: 0–24_576 tokens; undefined = "Auto"
 *  - enableThoughts: include hidden CoT JSON if true
 */
export const defaultGenerationConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 1,
  topK: 1,
  maxOutputTokens: 2048,
};

/** Optional: override Google's default safety filters here */
export const defaultSafety: SafetySetting[] = [];

/**
 * Example usage demonstrating the wiring.
 * @param topic Topic to explain
 * @param deep  If true enables reasoning via thinkingBudget
 */
export async function explainTopic(topic: string, deep = false) {
  const model = getModel(deep);
  const config = { ...defaultGenerationConfig };
  if (!deep) config.thinkingBudget = 0;
  const res = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `Explain ${topic}` }]}],
    generationConfig: config,
    safetySettings: defaultSafety,
  });
  return res.text();
}
