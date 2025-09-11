import React from 'react';
import { cn } from '../utils/cn';

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  dense?: boolean;
}

export function List({ dense = false, className, ...props }: ListProps) {
  return (
    <ul className={cn(dense ? 'space-y-1' : 'space-y-2', className)} {...props} />
  );
}

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  dense?: boolean;
}

export function ListItem({ dense = false, className, ...props }: ListItemProps) {
  return (
    <li
      className={cn(
        'rounded border hover:bg-white/5',
        dense ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm',
        className
      )}
      {...props}
    />
  );
}

