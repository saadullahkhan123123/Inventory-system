import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Fade } from '@mui/material';
import './App.css';
import Inventory from './pages/inventory';
import AddItems from './pages/addItems';
import Header from './pages/header';
import DashboardLayoutBasic from './pages/DashboardLayoutBasic';
import Dashboard from './pages/Dashboard';
import Slips from './pages/slips';
import Income from './pages/icome';
import SearchSlip from './pages/searchSlip';
import ViewSlips from './pages/viewslips';
import StartupAnimation from './components/StartupAnimation';
import CustomerHistory from './pages/CustomerHistory';
import BackendStatus from './components/BackendStatus';

// Page Transition Wrapper
function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'fadeOut') {
      const timer = setTimeout(() => {
        setTransitionStage('fadeIn');
        setDisplayLocation(location);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [transitionStage, location]);

  return (
    <Fade 
      in={transitionStage === 'fadeIn'} 
      timeout={300}
      mountOnEnter
      unmountOnExit
    >
      <Box sx={{ width: '100%' }}>
        {children}
      </Box>
    </Fade>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={
        <PageTransition>
          <Dashboard />
        </PageTransition>
      } />
      <Route path="/inventory" element={
        <PageTransition>
          <Inventory />
        </PageTransition>
      } />
      <Route path="/additems" element={
        <PageTransition>
          <AddItems />
        </PageTransition>
      } />
      <Route path="/income" element={
        <PageTransition>
          <Income />
        </PageTransition>
      } />
      <Route path="/slips/:slipId" element={
        <PageTransition>
          <ViewSlips />
        </PageTransition>
      } />
      <Route path="/slips" element={
        <PageTransition>
          <Slips />
        </PageTransition>
      } />
      <Route path="/slippage" element={
        <PageTransition>
          <ViewSlips />
        </PageTransition>
      } />
      <Route path="/pagecontent" element={
        <PageTransition>
          <DashboardLayoutBasic />
        </PageTransition>
      } />
      <Route path="/search-slips" element={
        <PageTransition>
          <SearchSlip />
        </PageTransition>
      } />
      <Route path="/customer-history" element={
        <PageTransition>
          <CustomerHistory />
        </PageTransition>
      } />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Router>
        <StartupAnimation isLoading={isLoading}>
          <BackendStatus />
          <Header />
          <AppRoutes />
        </StartupAnimation>
      </Router>
    </>
  );
}

export default App;