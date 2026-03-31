/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif KR"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        heading: '#222',
        body: '#333',
        meta: '#888',
      },
      maxWidth: {
        content: '680px',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '680px',
            color: '#333',
            lineHeight: '1.8',
            fontSize: '1.125rem',
            h1: { fontFamily: '"Noto Serif KR", serif' },
            h2: { fontFamily: '"Noto Serif KR", serif' },
            h3: { fontFamily: '"Noto Serif KR", serif' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
