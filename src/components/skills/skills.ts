import {
  SiTypescript, SiReact, SiNextdotjs, SiNodedotjs, SiTailwindcss,
  SiFramer, SiThreedotjs, SiSupabase, SiLinear, SiVercel, SiOpenai, SiGoogle,
} from 'react-icons/si';
import { TbBrandReactNative, TbCoin, TbChartBar, TbBellRinging } from 'react-icons/tb';
import type { IconType } from 'react-icons';

export type Skill = { label: string; icon: IconType };

export const CORE: Skill[] = [
  { label: 'TypeScript', icon: SiTypescript },
  { label: 'React', icon: SiReact },
  { label: 'Next.js', icon: SiNextdotjs },
  { label: 'React Native', icon: TbBrandReactNative },
  { label: 'Node', icon: SiNodedotjs },
  { label: 'Tailwind', icon: SiTailwindcss },
  { label: 'Framer Motion', icon: SiFramer },
  { label: 'Three.js / R3F', icon: SiThreedotjs },
];

export const PLATFORM: Skill[] = [
  { label: 'Supabase', icon: SiSupabase },
  { label: 'RevenueCat', icon: TbCoin },
  { label: 'AppsFlyer', icon: TbChartBar },
  { label: 'OneSignal', icon: TbBellRinging },
  { label: 'Linear', icon: SiLinear },
  { label: 'Vercel', icon: SiVercel },
  { label: 'OpenAI', icon: SiOpenai },
  { label: 'Google APIs', icon: SiGoogle },
];
