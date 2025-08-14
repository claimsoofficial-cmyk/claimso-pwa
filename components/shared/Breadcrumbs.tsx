'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

export default function Breadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/dashboard' }
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrent: index === segments.length - 1
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on homepage or if only one item
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-4">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.href}>
          {index === 0 ? (
            <Link
              href={item.href}
              className={cn(
                "flex items-center hover:text-gray-700 transition-colors",
                item.isCurrent && "text-gray-900 font-medium"
              )}
            >
              <Home className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href={item.href}
              className={cn(
                "hover:text-gray-700 transition-colors",
                item.isCurrent && "text-gray-900 font-medium"
              )}
            >
              {item.label}
            </Link>
          )}
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
