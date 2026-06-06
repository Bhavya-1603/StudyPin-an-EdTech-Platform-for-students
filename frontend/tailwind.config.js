export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 0 40px rgba(56, 189, 248, 0.15)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(59, 130, 246, 0.18), transparent 35%), radial-gradient(circle at bottom right, rgba(167, 139, 250, 0.16), transparent 30%)',
      },
    },
  },
  plugins: [],
}
