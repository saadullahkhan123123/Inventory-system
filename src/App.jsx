import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import './App.css';
import Header from './pages/header';
import StartupAnimation from './components/StartupAnimation';
import BackendStatus from './components/BackendStatus';

// Lazy load components for better performance
const Inventory = lazy(() => import('./pages/inventory'));
const AddItems = lazy(() => import('./pages/addItems'));
const DashboardLayoutBasic = lazy(() => import('./pages/DashboardLayoutBasic'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Slips = lazy(() => import('./pages/slips'));
const Income = lazy(() => import('./pages/icome'));
const SearchSlip = lazy(() => import('./pages/searchSlip'));
const SearchProducts = lazy(() => import('./pages/searchProducts'));
const ViewSlips = lazy(() => import('./pages/viewslips'));
const CustomerHistory = lazy(() => import('./pages/CustomerHistoryEnhanced'));

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <CircularProgress />
  </Box>
);

// Simplified page wrapper - removed heavy transitions for performance
function PageWrapper({ children }) {
  return <Box sx={{ width: '100%' }}>{children}</Box>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/dashboard" element={
          <PageWrapper>
            <Dashboard />
          </PageWrapper>
        } />
        <Route path="/inventory" element={
          <PageWrapper>
            <Inventory />
          </PageWrapper>
        } />
        <Route path="/additems" element={
          <PageWrapper>
            <AddItems />
          </PageWrapper>
        } />
        <Route path="/income" element={
          <PageWrapper>
            <Income />
          </PageWrapper>
        } />
        <Route path="/slips/:slipId" element={
          <PageWrapper>
            <ViewSlips />
          </PageWrapper>
        } />
        <Route path="/slips" element={
          <PageWrapper>
            <Slips />
          </PageWrapper>
        } />
        <Route path="/slippage" element={
          <PageWrapper>
            <ViewSlips />
          </PageWrapper>
        } />
        <Route path="/pagecontent" element={
          <PageWrapper>
            <DashboardLayoutBasic />
          </PageWrapper>
        } />
        <Route path="/search-slips" element={
          <PageWrapper>
            <SearchSlip />
          </PageWrapper>
        } />
        <Route path="/search-products" element={
          <PageWrapper>
            <SearchProducts />
          </PageWrapper>
        } />
        <Route path="/customer-history" element={
          <PageWrapper>
            <CustomerHistory />
          </PageWrapper>
        } />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Faster initial load - reduced delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <StartupAnimation isLoading={isLoading}>
        <BackendStatus />
        <Header />
        <AppRoutes />
      </StartupAnimation>
    </Router>
  );
}

export default App;