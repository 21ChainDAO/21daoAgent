import React from 'react';
import { Link } from 'react-router-dom';
import BackgroundFX from '../components/BackgroundFX';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowLeft } from 'lucide-react';

export default function StaticPage({ title, kicker, children }) {
  return (
    <div className="App scanlines vignette relative">
      <BackgroundFX />
      <div className="relative" style={{ zIndex: 10 }}>
        <Navbar />
        <main className="max-w-[900px] mx-auto px-6 py-16">
          <Link to="/" className="inline-flex items-center gap-2 font-pixel text-[9px] text-[#808080] hover:text-[#00FF29] mb-8">
            <ArrowLeft size={12} /> BACK
          </Link>
          <div className="section-label mb-4 inline-flex">{kicker}</div>
          <h1 className="font-pixel text-white text-[28px] md:text-[40px] mb-10">{title}</h1>
          <div className="prose-degen">
            {children}
          </div>
        </main>
        <Footer />
      </div>
      <style>{`
        .prose-degen { font-family: 'VT323', 'Space Mono', monospace; color: #b3b3b3; font-size: 19px; line-height: 1.55; }
        .prose-degen h2 { font-family: 'Press Start 2P', monospace; font-size: 13px; color: #00FF29; margin: 32px 0 12px; letter-spacing: 0.06em; }
        .prose-degen h3 { font-family: 'Press Start 2P', monospace; font-size: 10px; color: #F5F5F5; margin: 22px 0 8px; }
        .prose-degen p { margin: 0 0 14px; }
        .prose-degen ul { padding-left: 22px; margin: 0 0 14px; list-style: square; }
        .prose-degen li { margin: 4px 0; }
        .prose-degen strong { color: #F5F5F5; }
        .prose-degen a { color: #00FF29; text-decoration: underline; }
        .prose-degen code { background: #0d0d0d; color: #00FF29; padding: 1px 6px; border: 1px solid #1f1f1f; }
      `}</style>
    </div>
  );
}
