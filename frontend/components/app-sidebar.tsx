"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Notebook,
  Send,
  WalletCards,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Wordmark } from "@/components/landing/marks";
import { WalletChip } from "@/components/wallet-chip";
import { SHIELD_ENABLED } from "@/lib/config";

const gasItems = [
  { href: "/app/send", label: "Send", icon: Send },
  { href: "/app/credits", label: "Credits", icon: WalletCards },
];

const shieldItems = [
  { href: "/app/deposit", label: "Deposit", icon: ArrowDownToLine },
  { href: "/app/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { href: "/app/notes", label: "Notes", icon: Notebook },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-cream/10">
      <SidebarHeader className="border-b border-cream/10 px-4 py-5">
        <Link href="/" className="w-fit text-cream [--eye:#000]">
          <span className="inline-flex bg-black px-[12px] py-[8px]">
            <Wordmark className="text-[18px]" />
          </span>
        </Link>
        <p className="mt-4 px-0.5 text-[12px] font-normal leading-snug text-cream/45">
          Prepaid gas for Solana sends. No SOL needed on the signer.
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[0.08em] text-cream/35">
            Transfer
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-1">
              {gasItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="h-10 rounded-none text-[15px] data-[active=true]:bg-sun data-[active=true]:font-medium data-[active=true]:text-ink"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {SHIELD_ENABLED ? (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-[0.08em] text-cream/35">
              Shield
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1 px-1">
                {shieldItems.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        className="h-10 rounded-none text-[15px] data-[active=true]:bg-sun data-[active=true]:font-medium data-[active=true]:text-ink"
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>
      <SidebarFooter className="border-t border-cream/10 px-3 py-4">
        <WalletChip compact />
      </SidebarFooter>
    </Sidebar>
  );
}
