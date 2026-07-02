import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import Dashboard from '@/pages/Dashboard';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import { useStore } from '@/store';
import { useMonitoring } from '@/hooks/useMonitoring';

function App() {
  const token = useStore((state) => state.token);
  const apiKeys = useStore((state) => state.apiKeys);

  useMonitoring();

  // 如果未登录，显示登录页
  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Login />
      </div>
    );
  }

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
          <Route path="/login" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
