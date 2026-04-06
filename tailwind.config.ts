import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        purple: '#534AB7',
        'purple-dark': '#3C3489',
        'purple-light': '#EEEDFE',
        teal: '#1D9E75',
        amber: '#BA7517',
        coral: '#993C1D',
        bg: '#2C2C2A',
        'bg-card': '#363533',
        'bg-card-hover': '#3f3d3b',
      },
    },
  },
  plugins: [],
};

export default config;
