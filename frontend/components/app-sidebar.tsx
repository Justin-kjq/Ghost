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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Wordmark } from "@/components/landing/marks";
import { WalletChip } from "@/components/wallet-chip";

const items = [
  { href: "/app/send", label: "Send", icon: Send },
  { href: "/app/credits", label: "Credits", icon: WalletCards },
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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-1">
              {items.map((item) => {
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
      </SidebarContent>
      <SidebarFooter className="border-t border-cream/10 px-3 py-4">
        <WalletChip compact />
      </SidebarFooter>
    </Sidebar>
  );
}
