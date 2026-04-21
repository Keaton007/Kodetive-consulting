import { Hero } from '@/components/hero/Hero';
import { WorkSection } from '@/components/work/WorkSection';
import { About } from '@/components/about/About';
import { SkillsMarquee } from '@/components/skills/SkillsMarquee';
import { Contact } from '@/components/contact/Contact';
import { Footer } from '@/components/contact/Footer';

export default function Home() {
  return (
    <>
      <Hero />
      <WorkSection />
      <About />
      <SkillsMarquee />
      <Contact />
      <Footer />
    </>
  );
}
