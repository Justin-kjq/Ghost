"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  LayoutDashboard,
  Notebook,
  Settings,
  Activity,
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
import { GhostWordmark } from "@/components/ghost-mark";
import { WalletChip } from "@/components/wallet-chip";
import { CLUSTER } from "@/lib/config";

const items = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/deposit", label: "Deposit", icon: ArrowDownToLine },
  { href: "/app/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { href: "/app/notes", label: "Notes", icon: Notebook },
  { href: "/app/activity", label: "Activity", icon: Activity },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href="/" className="hover:opacity-80">
          <GhostWordmark markClassName="size-7" />
        </Link>
        <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          {CLUSTER} · test funds
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.href === "/app"
                    ? pathname === "/app"
                    : pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="data-[active=true]:bg-foreground data-[active=true]:text-background"
                    >
                      <Link href={item.href}>
                        <item.icon />
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
      <SidebarFooter className="px-3 py-4">
        <WalletChip compact />
      </SidebarFooter>
    </Sidebar>
  );
}
