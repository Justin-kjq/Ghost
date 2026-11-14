import Image from "next/image";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { WalletGuard } from "@/components/wallet-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
            <SidebarTrigger />
            <p className="text-sm text-muted-foreground">Ghost pool</p>
          </div>
          <div className="relative h-[180px] overflow-hidden border-b border-hairline">
            <Image
              src="/art/dashboard-tapestry.webp"
              alt=""
              fill
              className="object-cover object-[58%_28%] opacity-80"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/30 to-transparent" />
          </div>
          <div className="flex-1 px-4 py-8 md:px-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </WalletGuard>
  );
}
