import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Movies from './pages/Movies';
import SeriesPage from './pages/Series';
import MovieDetail from './pages/MovieDetail';
import SeriesDetail from './pages/SeriesDetail';
import Watch from './pages/Watch';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Movies />} />
        <Route path="/series" element={<SeriesPage />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
        <Route path="/watch/:type/:id" element={<Watch />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#111', color: '#fff', border: '1px solid #333', fontFamily: 'Rajdhani, sans-serif' },
            success: { iconTheme: { primary: '#fff', secondary: '#000' } }
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
