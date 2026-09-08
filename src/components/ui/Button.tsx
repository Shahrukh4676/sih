import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "link"
    | "brand";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer";

    const variantStyles: Record<string, string> = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow focus-visible:ring-blue-500 border border-blue-600 active:bg-blue-800",
      brand:
        "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow focus-visible:ring-slate-700 border border-slate-900 active:bg-black",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80 focus-visible:ring-slate-400 active:bg-slate-300",
      outline:
        "bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 hover:border-slate-400 shadow-xs focus-visible:ring-slate-400 active:bg-slate-100",
      ghost:
        "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400",
      destructive:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-500 border border-rose-600 active:bg-rose-800",
      link:
        "bg-transparent text-blue-600 hover:underline hover:text-blue-700 p-0 h-auto font-normal",
    };

    const sizeStyles: Record<string, string> = {
      xs: "text-xs px-2.5 py-1 gap-1.5 h-7",
      sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
      md: "text-sm px-4 py-2 gap-2 h-9",
      lg: "text-base px-5 py-2.5 gap-2.5 h-11",
      icon: "h-9 w-9 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
