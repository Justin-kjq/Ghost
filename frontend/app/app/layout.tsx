import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { WalletGuard } from "@/components/wallet-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletGuard>
      <div className="landing-root min-h-screen bg-cream text-ink">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-cream">
            <AppTopbar />
            <div className="flex-1 px-4 py-8 sm:px-6 md:px-8 md:py-10">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </WalletGuard>
  );
}
