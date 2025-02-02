import { nextui } from '@nextui-org/react';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          50: '#f7f7f7',
          100: '#ebebeb',
          200: '#d9d9d9',
          300: '#bfbfbf',
          400: '#a6a6a6',
          500: '#8c8c8c',
          600: '#737373',
          700: '#595959',
          800: '#404040',
          900: '#262626',
          950: '#171717',
        },
      },
    },
  },
  darkMode: "class",
  plugins: [nextui({
    themes: {
      dark: {
        colors: {
          background: '#000000',
          foreground: '#FFFFFF',
          primary: {
            50: '#ffffff',
            100: '#ebebeb',
            200: '#d9d9d9',
            300: '#bfbfbf',
            400: '#a6a6a6',
            500: '#8c8c8c',
            600: '#737373',
            700: '#595959',
            800: '#404040',
            900: '#262626',
            950: '#171717',
            DEFAULT: '#FFFFFF',
            foreground: '#000000',
          },
          focus: '#FFFFFF',
          default: {
            50: '#f7f7f7',
            100: '#ebebeb',
            200: '#d9d9d9',
            300: '#bfbfbf',
            400: '#a6a6a6',
            500: '#8c8c8c',
            600: '#737373',
            700: '#595959',
            800: '#404040',
            900: '#262626',
            950: '#171717',
          },
        },
        layout: {
          disabledOpacity: "0.3",
          radius: {
            small: "4px",
            medium: "6px",
            large: "8px",
          },
          borderWidth: {
            small: "1px",
            medium: "2px",
            large: "3px",
          },
        },
      },
    },
  })],
};

export default config;
