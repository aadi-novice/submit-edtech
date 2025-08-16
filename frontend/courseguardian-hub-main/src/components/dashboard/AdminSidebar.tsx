import React from 'react';
import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { 
  BookOpen, 
  Upload, 
  BarChart3, 
  Users, 
  Settings,
  Home
} from 'lucide-react';

const adminMenuItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: Home,
  },
  {
    title: 'Courses',
    url: '/admin/courses',
    icon: BookOpen,
  },
  {
    title: 'Upload Course',
    url: '/admin/upload',
    icon: Upload,
  },
  {
    title: 'Students',
    url: '/admin/students',
    icon: Users,
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    url: '/admin/settings',
    icon: Settings,
  },
];

export const AdminSidebar: React.FC = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className={cn(
        "border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent className="bg-card border-r">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            isCollapsed && "sr-only"
          )}>
            Admin Panel
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={isCollapsed ? item.title : undefined}
                    className="w-full"
                  >
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin'}
                      className={({ isActive: routeIsActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
                          "hover:bg-accent hover:text-accent-foreground",
                          routeIsActive || isActive(item.url)
                            ? "bg-primary text-primary-foreground shadow-sm font-medium"
                            : "text-muted-foreground"
                        )
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};