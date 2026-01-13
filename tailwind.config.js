/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./context/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#1a88ff',
                    dark: '#16181d'
                },
                secondary: {
                    DEFAULT: '#26d8c4',
                    dark: '#1f1f21'
                },
                background: {
                    light: '#faf6fd',
                    dark: '#16181d'
                },
                card: {
                    light: '#ffffff',
                    dark: '#1f1f21'
                }
            }
        },
    },
    plugins: [],
}
