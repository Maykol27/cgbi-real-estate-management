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
                    DEFAULT: "#0F172A", // CGBI Dark Navy
                    dark: "#020617",
                    foreground: "#F8FAFC"
                },
                secondary: {
                    DEFAULT: "#E11D48", // CGBI Pink/Magenta
                    foreground: "#FFFFFF"
                },
                accent: {
                    DEFAULT: "#E11D48",
                    hover: "#BE123C"
                },
                background: {
                    light: "#F8FAFC",
                    dark: "#0F172A"
                },
                card: {
                    light: "#FFFFFF",
                    dark: "#1E293B"
                },
                text: {
                    light: "#1F2937",
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
