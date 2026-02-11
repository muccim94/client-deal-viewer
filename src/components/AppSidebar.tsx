import { BarChart3, Table2, Upload, Coins, LogOut, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const allItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "Anagrafiche", url: "/anagrafiche", icon: Table2 },
  { title: "Provvigioni", url: "/provvigioni", icon: Coins },
  { title: "Upload Excel", url: "/upload", icon: Upload, adminOnly: true },
  { title: "Gestione Utenti", url: "/gestione-utenti", icon: Users, adminOnly: true },
];

export function AppSidebar() {
  const { role, signOut } = useAuth();
  const items = allItems.filter((item) => !item.adminOnly || role === "admin");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Esci</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
