'use client'

import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { PlayIcon } from '@/components/icons'
import { X } from 'lucide-react'
import { useAgentPopup } from '@/hooks/use-agent-popup'
import { useTranslation } from '@/lib/i18n'

export function AgentDialog() {
  const { isOpen, closePopup } = useAgentPopup()
  const t = useTranslation()

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={closePopup}>
      <DialogContent className="agentPreview relative bg-transparent border-none shadow-none p-0 max-w-none rounded-none">
        <VisuallyHidden>
          <DialogTitle>{t('agents')}</DialogTitle>
        </VisuallyHidden>
        <div className="relative mx-auto w-[95vw] max-w-[640px] rounded-[28px] p-8 pb-10 shadow-[0_2px_10px_rgba(0,0,0,0.08)]" id="agent-preview-card">
          <DialogClose asChild>
            <button className="glassIcon size-10 absolute right-3 top-3" aria-label="Close" type="button">
              <X size={20} />
            </button>
          </DialogClose>
          <h2 className="agentTitle font-bold text-[22px] tracking-[-0.25px] text-center">Luna</h2>
          <div className="demoMedia mx-auto mt-4 w-[56%] rounded-2xl overflow-hidden relative" aria-label="Voorbeeld van de assistent">
            <div className="aspect-video bg-[color:var(--brand-accent)]/40 flex items-center justify-center">
              <PlayIcon size={36} className="opacity-70" />
            </div>
          </div>
          <p className="description mx-auto mt-6 max-w-[60ch] text-center text-base text-black/80 dark:text-white/90">
            Creative writing assistant helping you craft stories and poems.
          </p>
          <hr className="my-6 border-t border-white/20" />
          <h3 className="text-sm font-medium mb-2 text-left">{t('chatsWithThisAssistant')}</h3>
          <div className="chatList h-[240px] overflow-y-auto rounded-[12px] p-2">
            <button className="chatRow w-full text-sm text-left h-10 px-4 rounded-full" type="button">Story ideas</button>
            <button className="chatRow w-full text-sm text-left h-10 px-4 rounded-full mt-1" type="button">Poem generator</button>
            <button className="chatRow w-full text-sm text-left h-10 px-4 rounded-full mt-1" type="button">Dialogue tips</button>
          </div>
          <div className="mt-8 flex justify-center">
            <Button className="bg-gradient-to-r from-[var(--brand-accent)] to-[#FFE3D2] text-white px-4 h-9 flex items-center shadow transition-shadow hover:shadow-[0_0_8px_rgba(255,255,255,0.5)]">
              {t('goToChat')}
            </Button>
          </div>
        </div>
        <style jsx>{`
          #agent-preview-card {
            background: var(--glass-fill-light);
            backdrop-filter: blur(14px) saturate(160%);
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1), 0 2px 10px rgba(0,0,0,0.08);
          }
          :global(.dark) #agent-preview-card {
            background: var(--glass-fill-dark);
          }
          .agentTitle {
            background: linear-gradient(90deg,var(--brand-accent),#FFE3D2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          :global(.dark) .agentTitle {
            background: linear-gradient(90deg,#B87333,#FFE3D2);
          }
          .chatList {
            background: rgba(255,255,255,0.10);
            backdrop-filter: blur(14px) saturate(160%);
          }
          :global(.dark) .chatList {
            background: rgba(255,255,255,0.04);
          }
          .chatRow:hover {
            background: rgba(255,185,139,0.12);
          }
          :global(.dark) .chatRow:hover {
            background: rgba(255,185,139,0.08);
          }
          .chatRow:focus-visible {
            outline: none;
            box-shadow: inset 0 0 0 2px var(--brand-accent);
          }
          .chatList::before,
          .chatList::after {
            content: '';
            position: sticky;
            left: 0;
            right: 0;
            height: 24px;
            pointer-events: none;
            background: linear-gradient(to bottom, var(--glass-fill-light), transparent);
          }
          .chatList::after {
            background: linear-gradient(to top, var(--glass-fill-light), transparent);
            top: auto;
            bottom: 0;
          }
          :global(.dark) .chatList::before {
            background: linear-gradient(to bottom, var(--glass-fill-dark), transparent);
          }
          :global(.dark) .chatList::after {
            background: linear-gradient(to top, var(--glass-fill-dark), transparent);
          }
          @media (max-width: 480px) {
            #agent-preview-card { padding-left: 0; padding-right: 0; width:95vw; }
            .description { font-size: 14px; }
            .chatList { height: 180px; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}
