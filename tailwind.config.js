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
                    DEFAULT: "#1A88FF", // SIKAI Brand Blue
                    dark: "#0066CC",
                    foreground: "#FFFFFF"
                },
                secondary: {
                    DEFAULT: "#26D8C4", // SIKAI Teal
                    foreground: "#0F172A"
                },
                accent: {
                    DEFAULT: "#6C757D", // Grey
                    hover: "#495057"
                },
                background: {
                    light: "#F3F4F6", // Lighter grey for premium feel
                    dark: "#0F172A"   // Deep Navy/Black
                },
                card: {
                    light: "#FFFFFF",
                    dark: "#1E293B"
                },
                text: {
                    light: "#111827",
                    dark: "#F9FAFB"
                },
                success: "#10B981",
                warning: "#F59E0B",
                danger: "#EF4444"
            }
        },
    },
    plugins: [],
}
