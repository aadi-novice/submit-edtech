import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
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
import { Loader } from '@/components/common/Loader';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpen,
  Search,
  GraduationCap
} from 'lucide-react';
import { Course } from '@/types/auth';
import { authAPI } from '@/services/api';
import { Input } from '@/components/ui/input';

export const StudentSidebar: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { state } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === 'collapsed';

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const coursesData = await authAPI.getCourses();
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const filteredCourses = useMemo(() => {
    if (!courses.length || searchQuery.trim() === '') {
      return courses;
    }
    return courses.filter(course =>
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, courses]);

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className={cn(
        "border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isCollapsed ? "w-16" : "w-80"
      )}
    >
      <SidebarContent className="flex flex-col h-full">
        {/* Navigation Section */}
        <SidebarGroup className="px-0">
          <SidebarGroupLabel className={cn(
            "px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            isCollapsed && "sr-only"
          )}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2">
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  tooltip="Dashboard"
                  className="w-full"
                >
                  <NavLink
                    to="/dashboard"
                    end
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm font-medium"
                          : "text-muted-foreground"
                      )
                    }
                  >
                    <Home className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium">Dashboard</span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Courses Section */}
        <SidebarGroup className="flex-1 px-0">
          <SidebarGroupLabel className={cn(
            "px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider",
            isCollapsed && "sr-only"
          )}>
            Available Courses
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex-1">
            {/* Search Input */}
            {!isCollapsed && (
              <div className="px-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-sm bg-background border-input"
                  />
                </div>
              </div>
            )}
            
            {/* Course List */}
            <div className="px-2 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader size="sm" text={!isCollapsed ? "Loading courses..." : ""} />
                </div>
              ) : (
                <SidebarMenu>
                  {filteredCourses.length === 0 ? (
                    <div className={cn(
                      "px-3 py-4 text-sm text-muted-foreground text-center",
                      isCollapsed && "sr-only"
                    )}>
                      {searchQuery ? (
                        <>
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No courses found</p>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No courses available</p>
                        </>
                      )}
                    </div>
                  ) : (
                    filteredCourses.map((course) => (
                      <SidebarMenuItem key={course.id}>
                        <SidebarMenuButton 
                          asChild 
                          tooltip={isCollapsed ? course.title : undefined}
                          className="w-full"
                        >
                          <NavLink
                            to={`/dashboard/course/${course.id}`}
                            className={({ isActive }) =>
                              cn(
                                "flex items-start gap-3 px-3 py-2.5 rounded-md transition-all duration-200 group min-h-[44px]",
                                "hover:bg-accent/50 hover:text-accent-foreground",
                                isActive
                                  ? "bg-accent text-accent-foreground border border-border/50"
                                  : "text-muted-foreground"
                              )
                            }
                          >
                            <BookOpen className="h-4 w-4 flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                            {!isCollapsed && (
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate leading-tight">
                                  {course.title}
                                </div>
                                {course.pdfCount !== undefined && (
                                  <div className="text-xs text-muted-foreground/80 truncate mt-0.5">
                                    {course.pdfCount} {course.pdfCount === 1 ? 'file' : 'files'}
                                  </div>
                                )}
                              </div>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default React.memo(StudentSidebar);