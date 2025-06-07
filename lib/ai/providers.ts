import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';         // 👈 switched from xai
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const myProvider = isTestEnvironment
  /* ——————————————————————  MOCKS FOR AUTOMATED TESTS  ——————————————————— */
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'basic-model': chatModel,
        'gemiddeld-model': chatModel,
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

        'basic-model': openai('gpt-4.1'),
        'gemiddeld-model': openai('gpt-4.1'),
        'top-model': openai('gpt-4.1'),

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
