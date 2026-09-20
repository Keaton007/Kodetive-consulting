export type ExternalLink = { label: string; href: string };

export type Project = {
  slug: string;
  index: string;
  title: string;
  status: string;
  year: string;
  stack: string[];
  cover: string;
  summary: string;
  externalLinks?: ExternalLink[];
  // CSS filter applied to the cover image. Useful when a bright screenshot
  // clashes with the dark theme (e.g. a light-mode site). Remove once the
  // upstream site ships dark mode.
  coverFilter?: string;
};

export const PROJECTS: Project[] = [
  {
    slug: 'shredder',
    index: '01',
    title: 'Shredder',
    status: 'In progress',
    year: '2026',
    stack: ['React Native', 'Supabase', 'RevenueCat', 'OneSignal'],
    cover: '/images/work/shredder-cover.jpg',
    summary:
      'A consumer mobile app that connects skiers and snowboarders. Track your sessions, find riders at your level, and link up on the mountain.',
    externalLinks: [
      { label: 'Website', href: 'https://www.tryshredder.com/' },
      { label: 'App Store', href: 'https://apps.apple.com/gb/app/shredder-find-friends/id6749258218' },
    ],
  },
  {
    slug: 'stat-ai',
    index: '02',
    title: 'Stat AI',
    status: 'Shipped',
    year: '2024',
    stack: ['React Native', 'OpenAI', 'AppsFlyer', 'RevenueCat'],
    cover: '/images/work/stat-ai-cover.jpg',
    summary:
      'Sports betting analysis powered by AI. Live odds from 19+ sportsbooks, paired with GPT-4 statistical breakdowns that turn gut calls into grounded data.',
    externalLinks: [
      { label: 'Website', href: 'https://www.statsports.ai/' },
      { label: 'App Store', href: 'https://apps.apple.com/us/app/stat-ai-sports-analysis/id6749340975' },
    ],
  },
  {
    slug: 'unit-converter',
    index: '03',
    title: 'Unit Converter',
    status: 'Shipped',
    year: '2024',
    stack: ['Next.js', 'TypeScript', 'Tailwind'],
    cover: '/images/work/unit-converter-cover.jpg',
    summary:
      'A free unit conversion utility that covers 12 measurement categories. Every formula is validated against NIST standards, with a small playbook of context for each domain.',
    externalLinks: [
      { label: 'Website', href: 'https://www.unitconverter.it.com/' },
    ],
    coverFilter: 'brightness(0.72) saturate(0.85) contrast(0.95)',
  },
];
