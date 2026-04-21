import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PROJECTS } from '@/components/work/projects';
import { CaseStudy } from '@/components/work/CaseStudy';
import Shredder from '@/components/work/content/shredder';
import StatAI from '@/components/work/content/stat-ai';
import UnitConverter from '@/components/work/content/unit-converter';

const CONTENT: Record<string, () => React.ReactElement> = {
  shredder: Shredder,
  'stat-ai': StatAI,
  'unit-converter': UnitConverter,
};

export function generateStaticParams() {
  return PROJECTS.map(p => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = PROJECTS.find(p => p.slug === slug);
  return p ? { title: `${p.title} — Keaton Jones`, description: p.summary } : {};
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const project = PROJECTS.find(p => p.slug === slug);
  const Body = CONTENT[slug];
  if (!project || !Body) notFound();
  return (
    <CaseStudy project={project}>
      <Body />
    </CaseStudy>
  );
}
