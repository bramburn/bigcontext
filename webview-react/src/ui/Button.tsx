import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder,#007acc)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[var(--vscode-button-background,#0e639c)] text-[var(--vscode-button-foreground,white)] hover:bg-[var(--vscode-button-hoverBackground,#1177bb)]',
        secondary: 'bg-[var(--vscode-button-secondaryBackground,#3c3c3c)] text-[var(--vscode-button-secondaryForeground,#cccccc)] hover:bg-[var(--vscode-button-secondaryHoverBackground,#4c4c4c)]',
        outline: 'border border-[var(--vscode-panel-border,#3c3c3c)] bg-transparent hover:bg-[var(--vscode-list-hoverBackground,#2a2d2e)]',
        ghost: 'hover:bg-[var(--vscode-list-hoverBackground,#2a2d2e)]',
        destructive: 'bg-[var(--vscode-errorForeground,#f14c4c)] text-white hover:bg-[var(--vscode-errorForeground,#f14c4c)]/90',
      },
      size: {
        default: 'h-8 px-3 py-1',
        sm: 'h-7 rounded-md px-2 text-xs',
        lg: 'h-9 rounded-md px-6',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
