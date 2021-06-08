module.exports = {
    purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    darkMode: 'media',
    theme: {
        extend: {
            backgroundColor: ['active'],
            height: {
                'fit-content': 'fit-content',
            }
        },
        screens: {
            'small': '1080px'
        }
    },
    variants: {
        extend: {
            opacity: ['disabled'],
        }
    },
    plugins: [],
}