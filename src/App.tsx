import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Assignments from "@/pages/Assignments";
import Timetable from "@/pages/Timetable";
import Events from "@/pages/Events";
import ChatAssistant from "@/pages/ChatAssistant";
import Quiz from "@/pages/Quiz";
import NotesAssistant from "@/pages/NotesAssistant";
import AIExplainer from "@/pages/AIExplainer";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";


const queryClient = new QueryClient();


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};


const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/assignments" element={<Assignments />} />
                      <Route path="/timetable" element={<Timetable />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/chat" element={<ChatAssistant />} />
                      <Route path="/quiz" element={<Quiz />} />
                      <Route path="/notes" element={<NotesAssistant />} />
                      <Route path="/explainer" element={<AIExplainer />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);


export default App;



