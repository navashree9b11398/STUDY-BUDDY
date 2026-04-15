import { LayoutDashboard, ClipboardList, Calendar, Sparkles, MessageCircle, BrainCircuit, BookOpen, LogOut, Sparkles as SparklesIcon, HelpCircle, Sun, Moon } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
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
} from "@/components/ui/sidebar";


const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Assignments", url: "/assignments", icon: ClipboardList },
  { title: "Timetable", url: "/timetable", icon: Calendar },
  { title: "Events", url: "/events", icon: Sparkles },
  { title: "AI Chat", url: "/chat", icon: MessageCircle },
  { title: "AI Quiz", url: "/quiz", icon: BrainCircuit },
  { title: "AI Notes", url: "/notes", icon: BookOpen },
  { title: "AI Explainer", url: "/explainer", icon: HelpCircle },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();


  const handleLogout = () => {
    logout();
  };


  return (
    <Sidebar collapsible="icon" className="bg-gradient-to-b from-blue-950 via-blue-900 to-black min-h-screen shadow-2xl border-r border-blue-800/30">
      <SidebarContent className="flex flex-col h-full">


        {/* Logo */}
        <div className="p-4 border-b border-blue-800/20">
          {!collapsed ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse-glow">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white leading-tight">StudyBuddy AI</h1>
                <p className="text-[10px] text-blue-300/70 leading-tight">Smart Student Assistant</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse-glow">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>


        {/* Menu */}
        <SidebarGroup className="flex-1 px-3 py-5">
          {!collapsed && (
            <SidebarGroupLabel className="text-blue-400/60 text-[10px] font-bold uppercase tracking-widest mb-3 px-2">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item, i) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-900/40"
                            : "text-blue-200/70 hover:bg-blue-800/50 hover:text-white"
                        }`
                      }
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-300 rounded-r-full" />
                          )}
                          <item.icon className={`h-4 w-4 flex-shrink-0 transition-transform duration-200 ${!collapsed ? "mr-3" : ""} ${isActive ? "" : "group-hover:scale-110"}`} />
                          {!collapsed && <span className="font-medium text-sm">{item.title}</span>}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>


        {/* Bottom Actions */}
        <SidebarGroup className="px-3 pb-5 border-t border-blue-800/20 pt-3">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex items-center px-3 py-2.5 rounded-xl text-blue-200/70 hover:bg-blue-800/50 hover:text-white transition-all duration-200 w-full group"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 flex-shrink-0 group-hover:rotate-45 transition-transform duration-300" />
                  ) : (
                    <Moon className="h-4 w-4 flex-shrink-0 group-hover:-rotate-12 transition-transform duration-300" />
                  )}
                  {!collapsed && <span className="font-medium text-sm ml-3">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2.5 rounded-xl text-blue-200/70 hover:bg-red-800/60 hover:text-red-200 transition-all duration-200 w-full group"
                >
                  <LogOut className="h-4 w-4 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
                  {!collapsed && <span className="font-medium text-sm ml-3">Logout</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}



