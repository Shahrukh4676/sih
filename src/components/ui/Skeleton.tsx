"use client";

import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  let variantStyles = "rounded-lg";

  if (variant === "text") {
    variantStyles = "h-4 rounded-md w-full";
  } else if (variant === "circular") {
    variantStyles = "rounded-full aspect-square";
  } else if (variant === "card") {
    variantStyles = "rounded-2xl h-44 w-full";
  }

  const customStyle: React.CSSProperties = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };

  return (
    <div
      className={`animate-pulse bg-slate-200/80 dark:bg-slate-800/80 ${variantStyles} ${className}`}
      style={customStyle}
      aria-hidden="true"
      {...props}
    />
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse border-b border-slate-100 dark:border-slate-850">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <Skeleton variant="text" className={`h-4 ${i === 0 ? "w-32" : "w-20"}`} />
        </td>
      ))}
    </tr>
  );
}
