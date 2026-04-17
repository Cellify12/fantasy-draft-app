import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import PasswordGate from './components/PasswordGate';
import DraftBoard from './pages/DraftBoard';
import Commissioner from './pages/Commissioner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-900">
          <Header />
          <Routes>
            <Route path="/" element={<DraftBoard />} />
            <Route path="/commissioner" element={<PasswordGate><Commissioner /></PasswordGate>} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
