import { useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { ClassifierSidebar } from './components/ClassifierSidebar';
import { DisclaimerFooter } from './components/DisclaimerFooter';
import { SampleCorpusBanner } from './components/SampleCorpusBanner';

export default function App() {
  const { isDarkMode, isSidebarOpen } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Header />
      <SampleCorpusBanner />
      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <aside className="w-72 flex-shrink-0 hidden lg:flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
            <ClassifierSidebar />
          </aside>
        )}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ChatPanel />
        </main>
      </div>
      <DisclaimerFooter />
    </div>
  );
}
