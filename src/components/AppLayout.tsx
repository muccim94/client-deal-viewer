import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Outlet, Link } from "react-router-dom";

export default function AppLayout() {
  const { role } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 md:h-14 flex items-center justify-between border-b px-3 md:px-4 bg-card">
            <div className="flex items-center gap-1.5 md:gap-2">
              <SidebarTrigger />
              <Link to="/" className="ml-1 text-sm md:text-lg font-semibold text-foreground truncate hover:text-primary transition-colors">
                <span className="hidden md:inline">Trade Off snc</span>
                <span className="md:hidden">Trade Off</span>
              </Link>
              {role === "admin" && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 p-3 md:p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
