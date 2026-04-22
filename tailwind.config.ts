import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: "rgb(255,111,0)",
          hot:     "rgb(255,105,0)",
          deep:    "rgb(245,73,0)",
          bright:  "rgb(255,107,0)",
          light:   "rgb(255,237,212)",
          pale:    "rgb(255,247,237)",
        },
        yellow:  "rgb(253,199,0)",
        ink:     "rgb(16,24,40)",
        surface: {
          DEFAULT: "rgb(249,250,251)",
          alt:     "rgb(243,244,246)",
        },
        danger: "rgb(244,67,54)",
      },
      borderRadius: {
        badge: "6px",
        chip:  "8px",
        icon:  "10px",
        thumb: "12px",
        stat:  "14px",
        card:  "16px",
        nudge: "20px",
        hero:  "24px",
        pill:  "999px",
      },
      boxShadow: {
        1:   "0 2px 4px -2px rgba(0,0,0,.1), 0 4px 6px -1px rgba(0,0,0,.1)",
        2:   "0 4px 6px -4px rgba(0,0,0,.1), 0 10px 15px -3px rgba(0,0,0,.1)",
        3:   "0 8px 10px -6px rgba(0,0,0,.1), 0 20px 25px -5px rgba(0,0,0,.1)",
        fab: "0 25px 50px -12px rgba(0,0,0,.25)",
      },
    },
  },
  plugins: [],
};

export default config;
