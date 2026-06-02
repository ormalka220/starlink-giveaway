import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Raffle from './pages/Raffle';
import RaffleSuccess from './pages/RaffleSuccess';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import Participants from './pages/admin/Participants';
import Messages from './pages/admin/Messages';
import Winners from './pages/admin/Winners';
import Settings from './pages/admin/Settings';
import Draw from './pages/Draw';
import Terms from './pages/Terms';

function RequireAuth({ children }: { children: JSX.Element }) {
  if (!localStorage.getItem('auth')) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/raffle" replace />} />
        <Route path="/raffle" element={<Raffle />} />
        <Route path="/raffle/success" element={<RaffleSuccess />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/draw/demo" element={<Draw demo />} />
        <Route path="/draw" element={<Draw />} />
        <Route path="/admin" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/admin/participants" element={<RequireAuth><Participants /></RequireAuth>} />
        <Route path="/admin/messages" element={<RequireAuth><Messages /></RequireAuth>} />
        <Route path="/admin/winners" element={<RequireAuth><Winners /></RequireAuth>} />
        <Route path="/admin/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/raffle" replace />} />
      </Routes>
    </ToastProvider>
  );
}
