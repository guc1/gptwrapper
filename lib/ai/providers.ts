import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai'; // 👈 switched from xai
import { createPartFromText } from '@google/genai';
import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1StreamPart,
} from 'ai';
import {
  getModel,
  defaultGenerationConfig,
  defaultSafety,
} from '@/geminiClient';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

function geminiLanguageModel(useThinking: boolean): LanguageModelV1 {
  const modelId = 'gemini-2.5-flash-preview-05-20';
  return {
    specificationVersion: 'v1',
    provider: 'google',
    modelId,
    async doGenerate({ prompt }: LanguageModelV1CallOptions) {
      const genModel = getModel(useThinking);
      const config = { ...defaultGenerationConfig };
      if (!useThinking) config.thinkingBudget = 0;
      let systemInstruction:
        | { role: string; parts: Array<{ text: string }> }
        | undefined;
      const contents = [] as Array<{
        role: string;
        parts: Array<{ text: string }>;
      }>;
      for (const { role, content, parts } of prompt) {
        let text: string | undefined;
        if (typeof content === 'string') {
          text = content;
        } else if (Array.isArray(content)) {
          const part = (content as Array<{ text?: string }>).find(
            (p) => typeof p.text === 'string',
          );
          text = part?.text;
        } else if (Array.isArray(parts)) {
          const part = (parts as Array<{ text?: string }>).find(
            (p) => typeof p.text === 'string',
          );
          text = part?.text;
        }
        const geminiRole = role === 'assistant' ? 'model' : role;
        const message = {
          role: geminiRole,
          parts: [createPartFromText(text ?? '')],
        };
        if (geminiRole === 'system') {
          systemInstruction = message;
        } else {
          contents.push(message);
        }
      }
      const params: Record<string, any> = {
        contents,
        generationConfig: config,
        safetySettings: defaultSafety,
      };
      if (systemInstruction) {
        params.systemInstruction = systemInstruction;
      }
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await genModel.generateContent(params);
          return {
            text: res.text,
            finishReason: 'stop',
            usage: { promptTokens: 0, completionTokens: 0 },
            rawCall: { rawPrompt: contents, rawSettings: config },
          };
        } catch (err: any) {
          console.error('Gemini request failed:', err);
          const is503 = err?.name === 'ServerError' || /503/.test(err?.message);
          if (attempt < 2 && is503) {
            await new Promise((r) =>
              setTimeout(r, 1000 * Math.pow(2, attempt)),
            );
            continue;
          }
          throw err;
        }
      }
    },
    async doStream(options: LanguageModelV1CallOptions) {
      const { text } = await this.doGenerate(options);
      const stream = new ReadableStream<LanguageModelV1StreamPart>({
        start(controller) {
          if (text) controller.enqueue({ type: 'text-delta', textDelta: text });
          controller.close();
        },
      });
      return { stream };
    },
  };
}

export const myProvider = isTestEnvironment
  ? /* ——————————————————————  MOCKS FOR AUTOMATED TESTS  ——————————————————— */
    customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'basis-model': chatModel,
        'plus-model': chatModel,
        'top-model': chatModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : /* ——————————————————————  PRODUCTION (OpenAI)  ———————————————————————— */
    customProvider({
      languageModels: {
        /* flagship model for normal chat                                */
        'chat-model': openai('gpt-4.1'), // GPT‑4.1 :contentReference[oaicite:4]{index=4}

        'basis-model': openai('gpt-4.1'),
        'plus-model': geminiLanguageModel(false),
        'top-model': geminiLanguageModel(true),

        /* reasoning stream with <think> traces, using 4o‑mini           */
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-4o-mini'), // GPT‑4o mini :contentReference[oaicite:5]{index=5}
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),

        /* tiny, cheap models for titles & document help                 */
        'title-model': openai('gpt-4o-mini'), // single‑shot tasks :contentReference[oaicite:6]{index=6}
        'artifact-model': openai('gpt-4o-mini'), // doc summaries etc. :contentReference[oaicite:7]{index=7}
      },

      imageModels: {
        /* DALL·E 3 remains OpenAI’s production image model              */
        'small-model': openai.image('dall-e-3'), // image gen :contentReference[oaicite:8]{index=8}
      },
    });
