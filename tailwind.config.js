module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // базовый шрифт на сайте
        sans: ['Montserrat-Regular', 'RussischSans', 'system-ui', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
        // отдельный стек для заголовков (по желанию)
        display: ['Montserrat-Regular', 'RussischSans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

