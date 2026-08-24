import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export const AppLayout = ({ activeTab, onSelectTab, onNavigateAuth, onOpenSearch, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-80 transition-all duration-300">
        {/* Top Header Navbar */}
        <Navbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onNavigateAuth={onNavigateAuth}
          onSelectTab={onSelectTab}
          onOpenSearch={onOpenSearch}
        />

        {/* Dynamic Viewport Content */}
        <main className="flex-1 p-6 sm:p-10 lg:p-12 w-full max-w-[2000px] mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
