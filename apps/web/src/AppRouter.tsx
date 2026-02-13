import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminPage } from '@/pages/AdminPage';
import { MatchPage } from '@/pages/MatchPage';
import { PlayPage } from '@/pages/PlayPage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/play" replace />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/match/:matchId" element={<MatchPage />} />
        <Route path="*" element={<Navigate to="/play" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
