import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  const { role } = useAuth();
  const { loading, totalCount, loadedCount } = useData();
  const showProgress = loading && totalCount > 0;
  const progressValue = totalCount > 0 ? Math.round((loadedCount / totalCount) * 100) : 0;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 md:h-14 flex items-center justify-between border-b px-3 md:px-4 bg-card">
            <div className="flex items-center gap-1.5 md:gap-2">
              <SidebarTrigger />
              <h1 className="ml-1 text-base md:text-lg font-semibold text-foreground truncate">Trade Off snc</h1>
              {role === "admin" && (
                <Badge variant="secondary" className="text-xs">Admin</Badge>
              )}
            </div>
            <ThemeToggle />
          </header>
          {showProgress && (
            <div className="px-4 py-2 bg-card border-b space-y-1">
              <Progress value={progressValue} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Caricamento... {loadedCount.toLocaleString("it-IT")} / {totalCount.toLocaleString("it-IT")} record
              </p>
            </div>
          )}
          <main className="flex-1 p-3 md:p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
