/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Padrão do Ecossistema Salomão
        salomao: {
          blue: '#112240',
          navy: '#0a192f', // Adicionado para compatibilidade com o seletor de módulos
          light: '#F3F4F6',
          gold: '#D4AF37',
          text: '#1e293b'
        },
        // Cores específicas para manter compatibilidade com componentes migrados
        'salomao-gold': '#D4AF37',
        'salomao-navy': '#0a192f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // Adicionado para suportar animações de entrada usadas na Controladoria
      animation: {
        'in': 'in 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-in-out',
      },
      keyframes: {
        'in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}