import React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../utils/cn';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder,#007acc)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--vscode-button-background,#0e639c)] data-[state=unchecked]:bg-[var(--vscode-panel-border,#3c3c3c)]',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-4 w-4 rounded-full bg-[var(--vscode-button-foreground,white)] shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
