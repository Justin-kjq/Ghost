import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { WalletGuard } from "@/components/wallet-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletGuard>
      <div className="landing-root min-h-screen bg-cream text-ink">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-cream">
            <div className="flex items-center border-b border-ink/15 bg-paper px-4 py-3 md:px-6 md:hidden">
              <SidebarTrigger className="rounded-none border border-ink/15 bg-transparent hover:bg-sand" />
            </div>
            <div className="flex-1 px-5 py-10 md:px-10 md:py-12">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </WalletGuard>
  );
}
