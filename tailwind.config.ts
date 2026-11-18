/* Tailwind config for the frontend react app. This is where the app theme should be defined: https://v2.tailwindcss.com/docs/configuration. */
import type { Config } from 'tailwindcss'

/*
 * Tema da interface, baseado no skip-design-system (app Skip Jornadas): fundo
 * #121313, roxo (#8348E8) só em ação — botão primário, toggle e foco —,
 * controles em pílula, cards com raio 24 e hover que acende em vez de levantar.
 * Os slides não usam estas cores; elas são só do app.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#F5F5F7',
        paper: '#121313',
        surface: '#1F2121',
        field: 'rgba(255, 255, 255, 0.03)',
        line: '#232323',
        mute: '#A6A6B3',
        // accent continua branco (texto/controles); o roxo de ação é accent-btn.
        accent: { DEFAULT: '#ffffff', dark: '#dadbdf', soft: '#1c1c1e' },
        'accent-btn': '#8348E8',
        'accent-btn-hover': '#6F1AE5',
        'accent-2': '#C3B0FF',
        sunset: { DEFAULT: '#ff7a17', soft: '#ffc285' },
        dusk: '#7c3aed',
        twilight: '#c4b5fd',
      },
      borderColor: { DEFAULT: '#232323' },
      fontFamily: {
        sans: ['Special Gothic', 'Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: [
          '"Geist Mono"',
          '"JetBrains Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      // Containers 24px (card/modal), 18px (dropdown), 12px (interno), 8px (detalhe).
      borderRadius: { md: '8px', lg: '12px', xl: '18px', '2xl': '24px' },
    },
  },
  plugins: [],
} satisfies Config
