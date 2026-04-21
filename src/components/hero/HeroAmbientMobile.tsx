import Image from 'next/image';

export default function HeroAmbientMobile() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Image
        src="/images/hero-ambient-fallback.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        style={{ objectFit: 'cover' }}
      />
    </div>
  );
}
