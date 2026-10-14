import { cn } from '@/utils/cn';
import { SYSTEM_CATEGORY_MAP } from '@/types/category';
import * as LucideIcons from 'lucide-react';

interface CategoryBadgeProps {
  category: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function CategoryBadge({ category, className, size = 'sm' }: CategoryBadgeProps) {
  const systemInfo = SYSTEM_CATEGORY_MAP[category];
  
  const label = systemInfo ? systemInfo.label : category;
  const color = systemInfo ? systemInfo.color : '#64748b';
  const iconName = systemInfo ? systemInfo.icon : 'Tag';
  
  // Динамическое получение компонента иконки
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Tag;

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
        sizes[size],
        className
      )}
      style={{
        backgroundColor: `${color}15`, // 15% прозрачности фона
        color: color,
      }}
    >
      <IconComponent className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}