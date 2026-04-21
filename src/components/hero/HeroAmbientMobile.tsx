export default function HeroAmbientMobile() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      style={{
        background:
          'radial-gradient(ellipse 80% 60% at 50% 20%, color-mix(in oklab, var(--accent) 8%, var(--bg)) 0%, var(--bg) 70%)',
      }}
    />
  );
}
