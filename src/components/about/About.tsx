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
                src="/images/avatar.JPG"
                alt="Keaton Jones"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
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
          {/* Draft copy. Written from facts in the codebase. Edit voice as needed. */}
          <div className="mt-8 space-y-6 text-[17px] leading-[1.7] text-[var(--fg)]">
            <RevealOnView delay={0.05}>
              <p>
                I&rsquo;m Keaton, a software engineer based in Utah. I build
                mobile and web frontends from start to finish. Most of my
                recent work has been in React Native and Next.js, and lately
                I&rsquo;ve been spending more time at the seam between AI and
                product. That&rsquo;s usually where the interesting questions
                are.
              </p>
            </RevealOnView>
            <RevealOnView delay={0.1}>
              <p>
                I treat frontend as a craft, not a chore. Easing curves,
                contrast ratios, the feel of a hover state. Those get the
                same care as the architecture and logic underneath. I work
                in tight loops with designers, ship in small increments, and
                bake performance into the brief from day one. For me,
                &ldquo;done&rdquo; means it feels right when you use it. Not
                &ldquo;the ticket is closed.&rdquo;
              </p>
            </RevealOnView>
            <RevealOnView delay={0.15}>
              <p>
                Right now I&rsquo;m looking for senior frontend roles where
                craft, motion, and performance are part of the everyday
                brief. If that sounds like your team, get in touch.
              </p>
            </RevealOnView>
          </div>
        </div>
      </div>
    </section>
  );
}
