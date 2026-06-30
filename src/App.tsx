import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import { useStore } from '@/store';
import { useMonitoring } from '@/hooks/useMonitoring';

function App() {
  const apiKeys = useStore((state) => state.apiKeys);

  useMonitoring();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Routes>
          <Route
            path="/"
            element={
              apiKeys.length === 0 ? (
                <Navigate to="/settings" replace />
              ) : (
                <Dashboard />
              )
            }
          />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
