'use client';

import { useMemo, useOptimistic, useState, startTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { chatModels } from '@/lib/ai/models';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

import { CheckCircleFillIcon, ChevronDownIcon, LockIcon } from './icons';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import type { Session } from 'next-auth';
import { useLoginSignupPopup } from '@/hooks/use-login-signup-popup';
import { useUpgradePopup } from '@/hooks/use-upgrade-popup';

export function ModelSelector({
  session,
  selectedModelId,
  onModelChange,
  className,
}: {
  session: Session;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
} & React.ComponentProps<typeof Button>) {
  const [open, setOpen] = useState(false);
  const [optimisticModelId, setOptimisticModelId] =
    useOptimistic(selectedModelId);

  const userType = session.user.type;
  const userModels = session.user.models ?? [];
  const baseModels = entitlementsByUserType[userType].availableChatModelIds;
  const availableChatModelIds = Array.from(
    new Set([...baseModels, ...userModels]),
  );

  const showAllModels = userType === 'guest' || userType === 'regular';
  const availableChatModels = showAllModels
    ? chatModels
    : chatModels.filter((chatModel) =>
        availableChatModelIds.includes(chatModel.id),
      );

  const selectedChatModel = useMemo(
    () => chatModels.find((chatModel) => chatModel.id === optimisticModelId),
    [optimisticModelId],
  );
  const t = useTranslation();
  const { openPopup: openLoginSignupPopup } = useLoginSignupPopup();
  const { openPopup: openUpgradePopup } = useUpgradePopup();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="model-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          <span className="mr-1 truncate max-w-[8rem]">
            {selectedChatModel ? t(selectedChatModel.nameKey) : null}
          </span>
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {availableChatModels.map((chatModel) => {
          const { id } = chatModel;
          const owned = availableChatModelIds.includes(id);

          return (
            <DropdownMenuItem
              data-testid={`model-selector-item-${id}`}
              key={id}
              onSelect={() => {
                setOpen(false);

                if (!owned) {
                  if (userType === 'guest') {
                    openLoginSignupPopup();
                  } else {
                    openUpgradePopup();
                  }
                  return;
                }

                startTransition(() => setOptimisticModelId(id));
                onModelChange?.(id);
                document.cookie = `chat-model=${id}; path=/`;
              }}
              data-active={id === optimisticModelId}
              asChild
            >
              <button
                type="button"
                className={cn(
                  'gap-4 group/item flex flex-row justify-between items-center w-full',
                  !owned && 'opacity-70',
                )}
              >
                <div className="flex flex-col gap-1 items-start">
                  <div>{t(chatModel.nameKey)}</div>
                  <div className="text-xs text-muted-foreground">
                    {t(chatModel.descriptionKey)}
                  </div>
                </div>

                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                  {owned ? <CheckCircleFillIcon /> : <LockIcon />}
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
