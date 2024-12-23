/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        Quicksand: ['Quicksand', 'sans-serif'],
        Anton: ['Anton', 'Quicksand'],
      },
      colors: {
        'black-transparent': 'rgba(0, 0, 0, 0.7)',
        'white' : '#FFFFFF',
        'card-bg': '#3A4A58',
        'graycolor' :'#BDBDBD',
        // 'btn-color' : '#4B6070',
        // 'tab-color' : '#1F2937',

        'bg-color' : '#000000',
        'btn-color' : '#1D9BF0',
        'tab-color' : '#000000',
        'input-color' : '#202327',
        'tab-text' : '#71767B'

      },
    },
  },
  plugins: [],
}
