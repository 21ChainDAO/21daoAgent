import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BackgroundFX from './components/BackgroundFX';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StatsSection from './components/StatsSection';
import Features from './components/Features';
import TradingPreview from './components/TradingPreview';
import WhyAndNumbers from './components/WhyAndNumbers';
import TokenSection from './components/TokenSection';
import Footer from './components/Footer';
import AppPortal from './app/AppPortal';
import Docs from './pages/Docs';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import CaBadge from './components/CaBadge';

function Landing() {
  return (
    <div className="App scanlines vignette relative">
      <BackgroundFX />
      <div className="relative" style={{ zIndex: 10 }}>
        <Navbar />
        <Hero />
        <StatsSection />
        <Features />
        <TradingPreview />
        <TokenSection />
        <WhyAndNumbers />
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/app/*" element={<AppPortal />} />
      </Routes>
      <CaBadge />
    </BrowserRouter>
  );
}

export default App;
