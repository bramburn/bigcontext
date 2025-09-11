/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/views/**/*.{tsx,ts}',
  ],
  safelist: [
    // Ensure critical webview classes are not purged
    /^bg-/,
    /^p-/,
    /^m-/,
    /^flex/,
    /^grid/,
    /^text-/,
    /^border/,
    /^rounded/,
    /^space-/,
    /^gap-/,
    /^justify-/,
    /^items-/,
    /^self-/,
    /^w-/,
    /^h-/,
    /^min-/,
    /^max-/,
    /^opacity-/,
    /^shadow-/,
    /^hover:/,
    /^focus:/,
    /^active:/,
    /^disabled:/,
    // Specific classes used in webview
    'min-h-screen',
    'w-full',
    'h-screen',
    'overflow-auto',
    'overflow-hidden',
    'overflow-y-auto',
    'overflow-x-hidden',
    'cursor-pointer',
    'cursor-default',
    'select-none',
    'select-text',
    'whitespace-nowrap',
    'whitespace-pre-wrap',
    'break-words',
    'break-all',
    'truncate',
    'font-mono',
    'font-sans',
    'font-semibold',
    'font-medium',
    'font-bold',
    'leading-tight',
    'leading-relaxed',
    'tracking-wide',
    'tracking-tight',
    // Radix UI related classes
    'data-[state=open]:animate-in',
    'data-[state=closed]:animate-out',
    'data-[state=open]:fade-in-0',
    'data-[state=closed]:fade-out-0',
    'data-[state=closed]:zoom-out-95',
    'data-[state=open]:zoom-in-95',
    'data-[side=bottom]:slide-in-from-top-2',
    'data-[side=left]:slide-in-from-right-2',
    'data-[side=right]:slide-in-from-left-2',
    'data-[side=top]:slide-in-from-bottom-2',
    // Animation classes
    'animate-in',
    'animate-out',
    'fade-in',
    'fade-out',
    'slide-in-from-top',
    'slide-in-from-bottom',
    'slide-in-from-left',
    'slide-in-from-right',
    'zoom-in',
    'zoom-out'
  ],
  theme: {
    extend: {
      spacing: {
        '0.5': '2px',   // 2px for micro adjustments
        '1': '4px',     // 4px base unit
        '1.5': '6px',   // 6px for fine-tuning
        '2': '8px',     // 8px standard small spacing
        '3': '12px',    // 12px medium spacing
        '4': '16px',    // 16px standard spacing
        '5': '20px',    // 20px for larger gaps
        '6': '24px',    // 24px section spacing
        '8': '32px',    // 32px large spacing
        '10': '40px',   // 40px extra large spacing
        '12': '48px',   // 48px for major sections
        '16': '64px',   // 64px for page-level spacing
      },
      // Custom responsive breakpoints for ultra-wide displays
      screens: {
        'ultrawide': '2560px',
      },
    },
  },
  plugins: [],
};

