import Image from 'next/image';
import { RevealOnView } from '@/components/interactions/RevealOnView';

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="border-t border-[var(--rule)] py-24 md:py-32">
      <div className="mx-auto grid max-w-[var(--content-max)] gap-12 px-6 md:grid-cols-12 md:gap-16">
        <div className="md:col-span-5">
          <RevealOnView>
            <div className="relative aspect-[4/5] w-full max-w-[420px] overflow-hidden bg-[var(--bg-elev)]">
              <Image
                src="/images/about-portrait-placeholder.jpg"
                alt="Keaton Jones"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover grayscale"
              />
            </div>
          </RevealOnView>
        </div>
        <div className="md:col-span-7">
          <RevealOnView>
            <h2
              id="about-title"
              className="font-[family-name:var(--font-display)] text-[clamp(32px,4vw,56px)] leading-tight tracking-tight"
            >
              About
            </h2>
          </RevealOnView>
          <div className="mt-8 space-y-6 text-[17px] leading-[1.7] text-[var(--fg)]">
            <RevealOnView delay={0.05}><p>[TODO — paragraph 1: who you are and the kind of work you gravitate to.]</p></RevealOnView>
            <RevealOnView delay={0.1}><p>[TODO — paragraph 2: how you work — process, craft, what &ldquo;done&rdquo; means to you.]</p></RevealOnView>
            <RevealOnView delay={0.15}><p>[TODO — paragraph 3: what you are looking for next. One sentence is fine.]</p></RevealOnView>
          </div>
        </div>
      </div>
    </section>
  );
}
