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
      className={isCollapsed ? 'w-14' : 'w-64'}
      collapsible="icon"
    >
      <SidebarContent className="bg-card border-r">
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'sr-only' : ''}>
            Admin Panel
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin'}
                      className={({ isActive: routeIsActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          routeIsActive || isActive(item.url)
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`
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