/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
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
            h1: { fontFamily: '"Pretendard Variable", Pretendard, sans-serif' },
            h2: { fontFamily: '"Pretendard Variable", Pretendard, sans-serif', marginTop: '2em' },
            h3: { fontFamily: '"Pretendard Variable", Pretendard, sans-serif', marginTop: '1.5em' },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:last-of-type::after': { content: 'none' },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
