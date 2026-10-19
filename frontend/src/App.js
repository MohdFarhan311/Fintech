import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MerchantDashboard from './pages/MerchantDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import FinanceHub from './pages/FinanceHub';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import FAQ from './pages/FAQ';
import InfoPage from './pages/InfoPage';
import './App.css';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/support" element={<InfoPage />} />
        <Route path="/privacy" element={<InfoPage />} />
        <Route path="/terms" element={<InfoPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/merchant/dashboard" element={
          <PrivateRoute role="merchant"><MerchantDashboard /></PrivateRoute>
        } />
        <Route path="/customer/dashboard" element={
          <PrivateRoute role="customer"><CustomerDashboard /></PrivateRoute>
        } />
        <Route path="/customer/finance" element={
          <PrivateRoute role="customer"><FinanceHub /></PrivateRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
