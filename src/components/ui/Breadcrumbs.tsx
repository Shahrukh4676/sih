"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-1.5 text-xs text-slate-500 font-medium ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            {isLast || !item.href ? (
              <span className={`truncate max-w-[200px] md:max-w-xs ${isLast ? "text-slate-900 dark:text-slate-200 font-semibold" : ""}`}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-slate-900 dark:hover:text-white transition-colors truncate max-w-[150px]"
              >
                {item.label === "Home" ? (
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    <span>Home</span>
                  </span>
                ) : (
                  item.label
                )}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
