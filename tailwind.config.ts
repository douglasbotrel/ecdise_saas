import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf6',
          100: '#dcfce9',
          500: '#22a559',
          600: '#178a47',
          700: '#146e3a',
        },
      },
    },
  },
  plugins: [],
}
export default config
