import * as Collapsible from '@radix-ui/react-collapsible';
import React from 'react';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { cn } from '../utils/cn';

export interface DisclosureProps {
  title: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Disclosure({ title, defaultOpen = true, className, children }: DisclosureProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft') setOpen(false);
    if (e.key === 'ArrowRight') setOpen(true);
  };

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className={cn('w-full', className)}>
      <Collapsible.Trigger
        onKeyDown={onKeyDown}
        className="flex w-full items-center gap-2 rounded border px-2 py-1.5 text-sm hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vscode-focusBorder,#007acc)]"
        aria-expanded={open}
      >
        <ChevronRightIcon className={cn('transition-transform', open && 'rotate-90')} />
        <span className="font-medium">{title}</span>
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2 overflow-hidden">
        {children}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

