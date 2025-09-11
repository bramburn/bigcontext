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
    'min-h-screen',
    'w-full',
    'h-screen',
    'overflow-auto'
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

