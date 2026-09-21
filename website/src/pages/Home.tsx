import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { WhyViewgrid } from '../components/WhyViewgrid';
import { Features } from '../components/Features';
import { HowItWorks } from '../components/HowItWorks';
import { StoreSection } from '../components/StoreSection';
import { ScreenshotGallery } from '../components/ScreenshotGallery';
import { Faq } from '../components/Faq';
import { Footer } from '../components/Footer';

export function Home() {
  return (
    <div className="site-root">
      <Header currentPath="/" />
      <main>
        <Hero />
        <WhyViewgrid />
        <Features />
        <HowItWorks />
        <StoreSection />
        <ScreenshotGallery />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
