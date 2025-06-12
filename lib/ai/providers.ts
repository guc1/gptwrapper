import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';         // 👈 switched from xai
import type {
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1StreamPart,
} from 'ai';
import { getModel, defaultGenerationConfig, defaultSafety } from '@/geminiClient';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

function geminiLanguageModel(useThinking: boolean): LanguageModelV1 {
  const modelId = useThinking
    ? 'gemini-2.5-flash-preview-05-20:thinking'
    : 'gemini-2.5-flash-preview-05-20';
  return {
    specificationVersion: 'v1',
    provider: 'google',
    modelId,
    async doGenerate({ prompt }: LanguageModelV1CallOptions) {
      const genModel = getModel(useThinking);
      const config = { ...defaultGenerationConfig };
      if (!useThinking) config.thinkingBudget = 0;
      const contents = prompt.map(({ role, content }) => ({
        role,
        parts: [{ text: content }],
      }));
      const res = await genModel.generateContent({
        contents,
        generationConfig: config,
        safetySettings: defaultSafety,
      });
      return {
        text: res.text(),
        finishReason: 'stop',
        usage: { promptTokens: 0, completionTokens: 0 },
        rawCall: { rawPrompt: contents, rawSettings: config },
      };
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
  /* ——————————————————————  MOCKS FOR AUTOMATED TESTS  ——————————————————— */
  ? customProvider({
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
  /* ——————————————————————  PRODUCTION (OpenAI)  ———————————————————————— */
  : customProvider({
      languageModels: {
        /* flagship model for normal chat                                */
        'chat-model': openai('gpt-4.1'),             // GPT‑4.1 :contentReference[oaicite:4]{index=4}

        'basis-model': openai('gpt-4.1'),
        'plus-model': geminiLanguageModel(false),
        'top-model': geminiLanguageModel(true),

        /* reasoning stream with <think> traces, using 4o‑mini           */
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('gpt-4o-mini'),              // GPT‑4o mini :contentReference[oaicite:5]{index=5}
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),

        /* tiny, cheap models for titles & document help                 */
        'title-model': openai('gpt-4o-mini'),        // single‑shot tasks :contentReference[oaicite:6]{index=6}
        'artifact-model': openai('gpt-4o-mini'),     // doc summaries etc. :contentReference[oaicite:7]{index=7}
      },

      imageModels: {
        /* DALL·E 3 remains OpenAI’s production image model              */
        'small-model': openai.image('dall-e-3'),     // image gen :contentReference[oaicite:8]{index=8}
      },
    });
