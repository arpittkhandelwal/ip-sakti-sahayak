import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { ClassifierSidebar } from './components/ClassifierSidebar';
import { DisclaimerFooter } from './components/DisclaimerFooter';

import { ABSWizard } from './pages/ABSWizard';
import { TKDLSearch } from './pages/TKDLSearch';
import { DocumentComparator } from './pages/DocumentComparator';
import { EvalDashboard } from './pages/EvalDashboard';

function MainLayout() {
  const { isSidebarOpen } = useAppStore();

  return (
    <div className="flex flex-1 overflow-hidden">
      {isSidebarOpen && (
        <aside className="w-80 flex-shrink-0 hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto">
          <ClassifierSidebar />
        </aside>
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ChatPanel />
      </main>
    </div>
  );
}

export default function App() {
  const { isDarkMode } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
        <Header />

        <div className="flex-1 overflow-y-auto flex flex-col">
          <Routes>
            <Route path="/" element={<MainLayout />} />
            <Route path="/abs-wizard" element={<div className="flex-1 overflow-y-auto"><ABSWizard /></div>} />
            <Route path="/tkdl" element={<div className="flex-1 overflow-y-auto"><TKDLSearch /></div>} />
            <Route path="/compare" element={<div className="flex-1 overflow-y-auto"><DocumentComparator /></div>} />
            <Route path="/eval" element={<div className="flex-1 overflow-y-auto"><EvalDashboard /></div>} />
            <Route path="*" element={<MainLayout />} />
          </Routes>
        </div>

        <DisclaimerFooter />
      </div>
    </BrowserRouter>
  );
}
