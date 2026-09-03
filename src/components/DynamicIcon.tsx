import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export function DynamicIcon({ name, size = 20, className = '' }: IconProps) {
  const IconComp = (Icons as unknown as Record<string, LucideIcon>)[name] || Icons.CheckCircle;
  return <IconComp size={size} className={className} />;
}
