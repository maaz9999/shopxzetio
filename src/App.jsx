import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useCart } from './context/CartContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PartnershipSlider from './components/PartnershipSlider';
import TrustBar from './components/TrustBar';
import HomeStorefront from './components/HomeStorefront';
import CategoryPage from './components/CategoryPage';
import ReelsSection from './components/ReelsSection';
import ReviewMediaGallery from './components/ReviewMediaGallery';
import ReviewsSection from './components/ReviewsSection';
import PartnersSection from './components/PartnersSection';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ProductDetailModal from './components/ProductDetailModal';
import CheckoutModal from './components/CheckoutModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import AdminDashboard from './components/AdminDashboard';
import LightPillar from './components/LightPillar';
import ProLoadouts from './components/ProLoadouts';
import ThermalBenchmark from './components/ThermalBenchmark';
import DeviceCompatibilityModal from './components/DeviceCompatibilityModal';
import OrderTrackerModal from './components/OrderTrackerModal';
import AuthPage from './components/AuthPage';
import AccountPage from './components/AccountPage';
import TrackOrderPage from './components/TrackOrderPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return <div className="app-container"><div className="global-site-bg-wrapper"><LightPillar topColor="#5227FF" bottomColor="#FF9FFC" intensity={0.85} rotationSpeed={0.25} glowAmount={0.0022} pillarWidth={3.2} pillarHeight={0.35} noiseIntensity={0.4} pillarRotation={25} interactive={false} mixBlendMode="screen" quality="high"/><div className="global-site-vignette"/></div>
    <Routes>
      <Route path="/" element={<Storefront/>}/>
      <Route path="/login" element={<AuthPage mode="login"/>}/>
      <Route path="/signup" element={<AuthPage mode="signup"/>}/>
      <Route path="/forgot-password" element={<AuthPage mode="forgot"/>}/>
      <Route path="/reset-password" element={<AuthPage mode="reset"/>}/>
      <Route path="/account/*" element={<ProtectedRoute><AccountPage/></ProtectedRoute>}/>
      <Route path="/track-order" element={<TrackOrderPage/>}/>
      <Route path="/admin/login" element={<AuthPage mode="login" admin/>}/>
      <Route path="/admin" element={<ProtectedRoute admin><AdminDashboard/></ProtectedRoute>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  </div>;
}

function Storefront() {
  const { currentView, toast, openCheckout } = useCart();
  const location = useLocation();
  const [compatModalOpen, setCompatModalOpen] = useState(false);
  const [trackerModalOpen, setTrackerModalOpen] = useState(false);

  useEffect(() => {
    window.openCompatModal = () => setCompatModalOpen(true);
    window.openTrackerModal = () => setTrackerModalOpen(true);
    return () => { delete window.openCompatModal; delete window.openTrackerModal; };
  }, []);
  useEffect(() => {
    if (new URLSearchParams(location.search).get('resume') === 'checkout') openCheckout();
  }, [location.search, openCheckout]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [currentView]);

  return <>{toast && <div className="cyber-toast"><i className="fa-solid fa-circle-check"/><span>{toast}</span></div>}
    <Navbar onOpenCompat={() => setCompatModalOpen(true)} onOpenTracker={() => setTrackerModalOpen(true)}/>
    <main>
      {(!currentView || currentView === 'home' || currentView === 'store') && <><Hero onOpenCompat={() => setCompatModalOpen(true)}/><PartnershipSlider/><TrustBar/><ReviewsSection/><HomeStorefront/><ReviewMediaGallery/><ProLoadouts/><ThermalBenchmark/><ReelsSection/><PartnersSection/></>}
      {currentView === 'coolers' && <CategoryPage categoryKey="coolers" title="Mobile Phone Coolers" subtitle="Peltier semiconductor chillers and rapid cooling radiators engineered to stop FPS drops." icon="fa-snowflake"/>}
      {currentView === 'audio' && <CategoryPage categoryKey="audio" title="Gaming Headsets & Audio" subtitle="Hi-Res acoustic drivers engineered for pinpoint competitive audio." icon="fa-headphones"/>}
      {currentView === 'splitters' && <CategoryPage categoryKey="splitters" title="60W DAC Fast Charge Splitters" subtitle="Simultaneous fast charging and lossless DAC audio." icon="fa-bolt"/>}
      {currentView === 'accessories' && <CategoryPage categoryKey="accessories" title="Esports Sleeves & Accessories" subtitle="Tournament-grade mobile gaming accessories." icon="fa-gamepad"/>}
      {currentView === 'arsenal' && <CategoryPage categoryKey="all" title="Complete Tournament Arsenal" subtitle="Explore our full catalog of authentic esports hardware." icon="fa-boxes-stacked"/>}
    </main>
    <Footer/><CartDrawer/><ProductDetailModal/><CheckoutModal/><OrderSuccessModal/><DeviceCompatibilityModal isOpen={compatModalOpen} onClose={() => setCompatModalOpen(false)}/><OrderTrackerModal isOpen={trackerModalOpen} onClose={() => setTrackerModalOpen(false)}/>
    <a href="https://wa.me/923348590229" target="_blank" rel="noreferrer" className="whatsapp-floating-btn"><i className="fa-brands fa-whatsapp"/><span className="tooltip">Chat with Support</span></a>
  </>;
}
