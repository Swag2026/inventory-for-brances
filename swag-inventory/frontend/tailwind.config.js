/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface2)',
        surface3: 'var(--surface3)',
        line: 'var(--border)',
        line2: 'var(--border2)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        muted2: 'var(--muted2)',
        primary: 'var(--primary)',
        primary2: 'var(--primary2)',
        link: 'var(--link)',
        ok: 'var(--green)',
        bad: 'var(--red)',
        warn: 'var(--amber)',
        info: 'var(--blue)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Ubuntu', '"Noto Sans"', 'Arial',
          '"Noto Sans Arabic"', 'sans-serif'],
      },
      keyframes: {
        fadeUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        pop: { from: { opacity: 0, transform: 'scale(.96) translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        toastIn: { from: { opacity: 0, transform: 'translateX(20px)' }, to: { opacity: 1, transform: 'none' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
      animation: {
        fadeUp: 'fadeUp .3s ease both',
        pop: 'pop .25s ease both',
        toastIn: 'toastIn .25s ease both',
        loginFade: 'fadeUp .6s ease both',
        pulseDot: 'pulseDot 2s infinite',
      },
    },
  },
  plugins: [],
}
