/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        salomao: {
          blue: '#112240', // O azul escuro da sidebar/login (aproximado)
          light: '#F3F4F6', // O fundo cinza claro
          gold: '#D4AF37', // Dourado/Mustard para detalhes (ajustar conforme necessidade)
          text: '#1e293b'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Fonte padrão clean
      }
    },
  },
  plugins: [],
}
