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
import Footer from './components/Footer';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
