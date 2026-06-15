import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ventes from './pages/Ventes';
import Predictions from './pages/Predictions';
import Produits from './pages/Produits';
import Clients from './pages/Clients';
import Rapports from './pages/Rapports';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background:'#1a1410', color:'#f5e6d0', border:'1px solid #3d2d1e', borderRadius:'10px' }
        }}/>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/"            element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<Dashboard />} />
            <Route path="/ventes"      element={<Ventes />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/produits"    element={<Produits />} />
            <Route path="/clients"     element={<Clients />} />
            <Route path="/rapports"    element={<Rapports />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
