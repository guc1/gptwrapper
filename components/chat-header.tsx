'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';

import { ModelSelector } from '@/components/model-selector';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { PlusIcon, VercelIcon } from './icons';
import { useSidebar } from './ui/sidebar';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { type VisibilityType, VisibilitySelector } from './visibility-selector';
import type { Session } from 'next-auth';
import { MessageLimitIndicator } from './message-limit-indicator'; // Added
import { useUpgradePopup } from '@/hooks/use-upgrade-popup';

const plansLength = 3;

function PureChatHeader({
  chatId,
  selectedModelId,
  selectedVisibilityType,
  isReadonly,
  session, // Added session prop
}: {
  chatId: string;
  selectedModelId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session; // Added session prop type
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { openPopup: openUpgradePopup } = useUpgradePopup();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 border-b"> {/* Added border-b for separation */}
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className="order-2 md:order-1 md:px-2 px-2 md:h-[34px] ml-auto md:ml-0" // md:h-fit changed to md:h-[34px] for consistency
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="hidden md:inline ml-1">New Chat</span> {/* Changed sr-only to hidden md:inline */}
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModelSelector
          session={session}
          selectedModelId={selectedModelId}
          className="order-1 md:order-2 shrink-0"
        />
      )}

      {!isReadonly && (
        <div className="order-1 md:order-3 flex items-center gap-2">
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
          {session?.user && (
            <MessageLimitIndicator userId={session.user.id} />
          )}
        </div>
      )}

      <div className="flex-grow md:flex-grow-0" /> {/* Pushes elements to the right more effectively */}

      {session?.user && session.user.models?.length !== plansLength && (
        <Button
          variant="outline"
          className="hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-last md:order-4 ml-2"
          onClick={() => openUpgradePopup()}
        >
          Upgrade
        </Button>
      )}

      <Button
        className="bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 hidden md:flex py-1.5 px-2 h-fit md:h-[34px] order-last md:order-5 ml-2" // order-4 to order-last/5 and ml-auto to ml-2
        asChild
      >
        <Link
          href={`https://vercel.com/new/clone?repository-url=https://github.com/vercel/ai-chatbot&env=AUTH_SECRET&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https://github.com/vercel/ai-chatbot/blob/main/.env.example&demo-title=AI%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https://chat.vercel.ai&products=[{"type":"integration","protocol":"ai","productSlug":"grok","integrationSlug":"xai"},{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"},{"type":"integration","protocol":"storage","productSlug":"upstash-kv","integrationSlug":"upstash"},{"type":"blob"}]`}
          target="_blank" // Corrected target
        >
          <VercelIcon size={16} />
          Deploy
        </Link>
      </Button>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  if (prevProps.selectedModelId !== nextProps.selectedModelId) return false;
  if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) return false;
  if (prevProps.isReadonly !== nextProps.isReadonly) return false;
  // Add more checks if needed, e.g., for session changes that affect UI
  return true;
});