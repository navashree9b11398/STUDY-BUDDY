import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";


export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center border-b border-gray-100/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 glass px-6 shadow-sm sticky top-0 z-10">
            <SidebarTrigger className="mr-4 hover:scale-110 transition-transform duration-150" />
            <span className="text-sm font-semibold gradient-text">StudyBuddy AI – Smart Student Assistant</span>
          </header>
          <main key={location.pathname} className="flex-1 p-8 overflow-auto page-enter">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}



