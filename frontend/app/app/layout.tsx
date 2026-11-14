import Image from "next/image";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { WalletGuard } from "@/components/wallet-guard";
import { Separator } from "@/components/ui/separator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletGuard>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="relative isolate h-36 overflow-hidden border-b border-hairline md:h-44">
            <Image
              src="/art/dashboard-tapestry.webp"
              alt=""
              fill
              className="object-cover opacity-45"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
            <div className="relative z-10 flex h-full items-end gap-3 px-4 pb-4">
              <SidebarTrigger className="bg-background/70" />
              <Separator orientation="vertical" className="h-5" />
              <p className="font-serif text-xl tracking-tight">Pool</p>
            </div>
          </header>
          <div className="flex-1 px-4 py-8 md:px-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </WalletGuard>
  );
}
