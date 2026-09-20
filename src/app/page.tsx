import { CircuitBackground } from '@/components/background/CircuitBackground';
import { Hero } from '@/components/hero/Hero';
import { HeroBanner } from '@/components/hero/HeroBanner';
import { WorkSection } from '@/components/work/WorkSection';
import { About } from '@/components/about/About';
import { Contact } from '@/components/contact/Contact';
import { Footer } from '@/components/contact/Footer';

export default function Home() {
  return (
    <>
      <CircuitBackground />
      <Hero />
      <HeroBanner />
      <WorkSection />
      <About />
      <Contact />
      <Footer />
    </>
  );
}
