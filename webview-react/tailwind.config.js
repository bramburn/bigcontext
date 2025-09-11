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
    extend: {},
  },
  plugins: [],
};

