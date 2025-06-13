'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { memo } from 'react';
import { useLanguage } from './language-provider';
import type { UseChatHelpers } from '@ai-sdk/react';
import type { VisibilityType } from './visibility-selector';

interface SuggestedActionsProps {
  chatId: string;
  append: UseChatHelpers['append'];
  selectedVisibilityType: VisibilityType;
}

function PureSuggestedActions({
  chatId,
  append,
  selectedVisibilityType,
}: SuggestedActionsProps) {
  const { lang } = useLanguage();

  const suggestedActions =
    lang === 'nl'
      ? [
          {
            title: 'Vertel mij een feitje',
            label: 'over Nederland',
            action: 'Vertel mij een feitje over Nederland',
          },
          {
            title: 'Waarom is de Nederlandse',
            label: 'vlag rood, wit en blauw?',
            action: 'Waarom is de Nederlandse vlag rood, wit en blauw?',
          },
          {
            title: 'Wat is het weer',
            label: 'in Amsterdam vandaag?',
            action: 'Wat is het weer in Amsterdam vandaag?',
          },
          {
            title: 'Schrijf een gedicht',
            label: 'over een koe',
            action: 'Schrijf een gedicht over een koe',
          },
        ]
      : [
          {
            title: 'Tell me a fact',
            label: 'about the Netherlands',
            action: 'Tell me a fact about the Netherlands',
          },
          {
            title: 'Why is the Dutch flag',
            label: 'red, white, and blue?',
            action: 'Why is the Dutch flag red, white, and blue?',
          },
          {
            title: "What's the weather",
            label: 'in Amsterdam today?',
            action: "What's the weather in Amsterdam today?",
          },
          {
            title: 'Write a poem',
            label: 'about a cow',
            action: 'Write a poem about a cow',
          },
        ];

  return (
    <div
      data-testid="suggested-actions"
      className="grid sm:grid-cols-2 gap-2 w-full"
    >
      {suggestedActions.map((suggestedAction, index) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ delay: 0.05 * index }}
          key={`suggested-action-${suggestedAction.title}-${index}`}
          className={index > 1 ? 'hidden sm:block' : 'block'}
        >
          <Button
            variant="ghost"
            onClick={async () => {
              window.history.replaceState({}, '', `/chat/${chatId}`);

              append({
                role: 'user',
                content: suggestedAction.action,
              });
            }}
            className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
          >
            <span className="font-medium">{suggestedAction.title}</span>
            <span className="text-muted-foreground">
              {suggestedAction.label}
            </span>
          </Button>
        </motion.div>
      ))}
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) return false;
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType)
      return false;

    return true;
  },
);
