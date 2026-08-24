import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { ClassesAndSections } from "./pages/ClassesAndSections";
import { Exams } from "./pages/Exams";
import { QuestionPapers } from "./pages/QuestionPapers";
import { ProfileSettings } from "./pages/ProfileSettings";
import { Auth } from "./pages/Auth";
import { Modal } from "./components/common/Modal";
import { GlobalSearchModal } from "./components/common/GlobalSearchModal";

function MainApp() {
  const [activeTab, setActiveTab] = useState("classes");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  // Global Ctrl + K / Cmd + K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNavigate = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        onNavigateAuth={() => setAuthModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
      >
        {activeTab === "dashboard" && <Dashboard onNavigate={handleNavigate} />}
        {activeTab === "classes" && <ClassesAndSections />}
        {activeTab === "exams" && <Exams />}
        {activeTab === "question-papers" && <QuestionPapers />}
        {activeTab === "settings" && (
          <ProfileSettings
            onNavigate={handleNavigate}
            onNavigateAuth={() => setAuthModalOpen(true)}
          />
        )}
        {activeTab === "auth" && (
          <Auth
            onSuccess={() => handleNavigate("classes")}
            onCancel={() => handleNavigate("classes")}
          />
        )}
      </AppLayout>

      {/* Quick Auth Modal for when clicking Sign In from any page */}
      <Modal
        isOpen={authModalOpen && !isAuthenticated}
        onClose={() => setAuthModalOpen(false)}
        title=""
        maxWidth="max-w-md"
      >
        <Auth
          onSuccess={() => setAuthModalOpen(false)}
          onCancel={() => setAuthModalOpen(false)}
        />
      </Modal>

      {/* Global Spotlight Search Modal (Ctrl + K) */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleNavigate}
      />
    </>
  );
}

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;