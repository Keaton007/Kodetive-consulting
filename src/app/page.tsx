import { Hero } from '@/components/hero/Hero';
import { WorkSection } from '@/components/work/WorkSection';
import { About } from '@/components/about/About';
import { Contact } from '@/components/contact/Contact';
import { Footer } from '@/components/contact/Footer';

export default function Home() {
  return (
    <>
      <Hero />
      <WorkSection />
      <About />
      <Contact />
      <Footer />
    </>
  );
}
