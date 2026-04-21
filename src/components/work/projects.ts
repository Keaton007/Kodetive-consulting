export type Project = {
  slug: string;
  index: string;
  title: string;
  status: string;
  year: string;
  stack: string[];
  cover: string;
  summary: string;
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
    summary: 'A mobile product — summary to be filled in.',
  },
  {
    slug: 'stat-ai',
    index: '02',
    title: 'Stat AI',
    status: 'Shipped',
    year: '2024',
    stack: ['React Native', 'OpenAI', 'AppsFlyer', 'RevenueCat'],
    cover: '/images/work/stat-ai-cover.jpg',
    summary: 'An AI-powered mobile app — summary to be filled in.',
  },
  {
    slug: 'unit-converter',
    index: '03',
    title: 'Unit Converter',
    status: 'Shipped',
    year: '2024',
    stack: ['Next.js', 'TypeScript', 'Tailwind'],
    cover: '/images/work/unit-converter-cover.jpg',
    summary: 'A focused utility — summary to be filled in.',
  },
];
