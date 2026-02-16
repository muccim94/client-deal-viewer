import { BarChart3, Table2, Upload, Coins, LogOut, Users, Tag } from "lucide-react";
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
  { title: "Marchi", url: "/marchi", icon: Tag },
  { title: "Provvigioni", url: "/provvigioni", icon: Coins },
  { title: "Upload Excel", url: "/upload", icon: Upload, adminOnly: true },
  { title: "Gestione Utenti", url: "/gestione-utenti", icon: Users, adminOnly: true },
];

export function AppSidebar() {
  const { user, role, canViewProvvigioni, signOut } = useAuth();
  const items = allItems.filter((item) => {
    if (item.adminOnly) return role === "admin";
    if (item.url === "/provvigioni") return role === "admin" || canViewProvvigioni;
    return true;
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title} className="min-h-[44px]">
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
        {user?.email && (
          <div className="px-3 py-1 text-xs text-muted-foreground truncate">
            {user.email}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground min-h-[44px]"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Esci</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
