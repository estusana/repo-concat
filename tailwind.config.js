/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [
        // Note: @tailwindcss/forms needs to be imported differently in ES modules
        // We'll add this after testing the basic setup
    ],
}