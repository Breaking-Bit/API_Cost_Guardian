<<<<<<< HEAD
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
=======
/** @type {import('postcss-load-config').Config} */
export default {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}
>>>>>>> d812cb3a95a13467e6bda960111af56fa9bbfd86
