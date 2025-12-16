/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'Inter',
                    '-apple-system',
                    'BlinkMacSystemFont',
                    '"San Francisco"',
                    '"Helvetica Neue"',
                    'Helvetica',
                    'Arial',
                    'sans-serif',
                ],
            },
            colors: {
                ios: {
                    bg: '#F2F2F7',      // System Gray 6
                    card: '#FFFFFF',    // White
                    text: '#000000',
                    subtext: '#8E8E93',
                    separator: '#C6C6C8',
                    blue: 'var(--ios-blue)', // Dynamic Theme Color
                    red: '#FF3B30',
                    green: '#34C759',
                    indigo: '#5856D6',
                    orange: '#FF9500',
                    yellow: '#FFCC00',
                    teal: '#5AC8FA',
                    purple: '#AF52DE',
                }
            },
            boxShadow: {
                'ios': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                'ios-lg': '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
            },
            backdropBlur: {
                'xs': '2px',
            },
            keyframes: {
                'slide-up': {
                    '0%': { transform: 'translateY(100%)' },
                    '100%': { transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-down': {
                    '0%': { transform: 'translate(-50%, -100%)', opacity: '0' },
                    '100%': { transform: 'translate(-50%, 0)', opacity: '1' },
                }
            },
            animation: {
                'slide-up': 'slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                'fade-in': 'fade-in 0.2s ease-in-out',
                'slide-down': 'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }
        },
    },
    plugins: [],
}
