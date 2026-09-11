"use client";

import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "./Breadcrumbs";

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  badge?: React.ReactNode;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  breadcrumbs,
  title,
  description,
  badge,
  primaryAction,
  secondaryActions,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`space-y-3 pb-6 border-b border-slate-200/80 dark:border-slate-800/80 ${className}`}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
              {description}
            </p>
          )}
        </div>

        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>
    </div>
  );
}
