'use client';

import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon, AgentsIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useTranslation } from '@/lib/i18n';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const t = useTranslation();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <Image
                src="/images/ChatGPT Image Jun 11, 2025, 12_30_18 PM.png"
                alt="NLmodel"
                width={160}
                height={160}
                className="w-40 h-40 object-contain"
                style={{ marginTop: '-60px' }}
              />
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="ripple new-chat-button p-2.5 h-fit"
                  style={{ marginTop: '-60px' }}
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon size={20} />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">{t('newChat')}</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
        <SidebarMenu>
          <Link
            href="/assistenten"
            onClick={() => {
              setOpenMobile(false);
            }}
            className="flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-accent"
          >
            <AgentsIcon />
            {t('agents')}
          </Link>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
