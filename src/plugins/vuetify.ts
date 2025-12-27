/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Composables
import { createVuetify } from 'vuetify'
// Styles
import '@mdi/font/css/materialdesignicons.css'

import 'vuetify/styles'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'system',
    themes: {
      nord: {
        dark: false,
        colors: {
          'background': '#ECEFF4',
          'surface': '#E5E9F0',
          'on-background': '#2E3440',
          'on-surface': '#2E3440',

          'primary': '#88C0D0',
          'secondary': '#81A1C1',
          'accent': '#8FBCBB',

          'error': '#BF616A',
          'warning': '#EBCB8B',
          'info': '#5E81AC',
          'success': '#A3BE8C',
        },
      },
      nordDark: {
        dark: true,
        colors: {
          'background': '#2E3440',
          'surface': '#3B4252',
          'on-background': '#ECEFF4',
          'on-surface': '#ECEFF4',

          'primary': '#88C0D0',
          'secondary': '#81A1C1',
          'accent': '#8FBCBB',

          'error': '#BF616A',
          'warning': '#EBCB8B',
          'info': '#5E81AC',
          'success': '#A3BE8C',
        },
      },
      dracula: {
        dark: true,
        colors: {
          'background': '#282A36',
          'surface': '#44475A',
          'on-background': '#F8F8F2',
          'on-surface': '#F8F8F2',

          'primary': '#BD93F9',
          'secondary': '#FF79C6',
          'accent': '#8BE9FD',

          'error': '#FF5555',
          'warning': '#FFB86C',
          'info': '#8BE9FD',
          'success': '#50FA7B',
        },
      },
      gruvbox: {
        dark: true,
        colors: {
          'background': '#282828',
          'surface': '#3C3836',
          'on-background': '#EBDBB2',
          'on-surface': '#EBDBB2',

          'primary': '#FABD2F',
          'secondary': '#83A598',
          'accent': '#D3869B',

          'error': '#FB4934',
          'warning': '#FE8019',
          'info': '#8EC07C',
          'success': '#B8BB26',
        },
      },
      solarizedDark: {
        dark: true,
        colors: {
          'background': '#002B36',
          'surface': '#073642',
          'on-background': '#EEE8D5',
          'on-surface': '#EEE8D5',

          'primary': '#268BD2',
          'secondary': '#2AA198',
          'accent': '#B58900',

          'error': '#DC322F',
          'warning': '#CB4B16',
          'info': '#2AA198',
          'success': '#859900',
        },
      },
      catppuccinMocha: {
        dark: true,
        colors: {
          'background': '#1E1E2E',
          'surface': '#313244',
          'on-background': '#CDD6F4',
          'on-surface': '#CDD6F4',

          'primary': '#CBA6F7',
          'secondary': '#89B4FA',
          'accent': '#94E2D5',

          'error': '#F38BA8',
          'warning': '#FAB387',
          'info': '#74C7EC',
          'success': '#A6E3A1',
        },
      },
      rosePineDawn: {
        dark: false,
        colors: {
          'background': '#FAF4ED',
          'surface': '#F2E9E1',
          'on-background': '#464261',
          'on-surface': '#464261',

          'primary': '#B4637A',
          'secondary': '#D7827E',
          'accent': '#907AA9',

          'error': '#B4637A',
          'warning': '#EA9D34',
          'info': '#56949F',
          'success': '#286983',
        },
      },
      everforestDark: {
        dark: true,
        colors: {
          'background': '#2D353B',
          'surface': '#343F44',
          'on-background': '#D3C6AA',
          'on-surface': '#D3C6AA',

          'primary': '#A7C080',
          'secondary': '#83C092',
          'accent': '#DBBC7F',

          'error': '#E67E80',
          'warning': '#E69875',
          'info': '#7FBBB3',
          'success': '#A7C080',
        },
      },
      amoledBlack: {
        dark: true,
        colors: {
          'background': '#000000',
          'surface': '#0A0A0A',
          'on-background': '#FFFFFF',
          'on-surface': '#FFFFFF',

          'primary': '#BB86FC',
          'secondary': '#03DAC6',
          'accent': '#CF6679',

          'error': '#CF6679',
          'warning': '#FFB74D',
          'info': '#64B5F6',
          'success': '#81C784',
        },
      },
      amoledGray: {
        dark: true,
        colors: {
          'background': '#000000',
          'surface': '#121212',
          'on-background': '#FFFFFF',
          'on-surface': '#FFFFFF',

          'primary': '#BB86FC',
          'secondary': '#03DAC6',
          'accent': '#8AB4F8',

          'error': '#CF6679',
          'warning': '#FFB74D',
          'info': '#8AB4F8',
          'success': '#81C784',
        },
      },
      earthGaia: {
        dark: false,
        colors: {
          'background': '#F4F7EE',
          'surface': '#EAF0E4',
          'on-background': '#233027',
          'on-surface': '#233027',

          'primary': '#2F855A',
          'secondary': '#4C9F70',
          'accent': '#C2A14A',

          'error': '#B85C5C',
          'warning': '#C97E3A',
          'info': '#2B6CB0',
          'success': '#2F855A',
        },
      },
      corporateClassic: {
        dark: false,
        colors: {
          'background': '#F5F7FA',
          'surface': '#FFFFFF',
          'on-background': '#2C3E50',
          'on-surface': '#2C3E50',

          'primary': '#1E3A8A',
          'secondary': '#64748B',
          'accent': '#0891B2',

          'error': '#B91C1C',
          'warning': '#D97706',
          'info': '#0369A1',
          'success': '#047857',
        },
      },
      anime: {
        dark: false,
        colors: {
          'background': '#FFF5F7',
          'surface': '#FFFFFF',
          'on-background': '#1A1A2E',
          'on-surface': '#1A1A2E',

          'primary': '#FF3366',
          'secondary': '#3357FF',
          'accent': '#FFD700',

          'error': '#D50000',
          'warning': '#FFA726',
          'info': '#29B6F6',
          'success': '#66BB6A',
        },
      },
      darkVoid: {
        dark: true,
        colors: {
          'background': '#0A0A0F',
          'surface': '#15151F',
          'on-background': '#E0D5E8',
          'on-surface': '#E0D5E8',

          'primary': '#8B5CF6',
          'secondary': '#6B21A8',
          'accent': '#DC2626',

          'error': '#B91C1C',
          'warning': '#CA8A04',
          'info': '#6366F1',
          'success': '#059669',
        },
      },
      neoBrutalArt: {
        dark: false,
        colors: {
          'background': '#FFFEF9',
          'surface': '#F5F5F0',
          'on-background': '#000000',
          'on-surface': '#000000',

          'primary': '#FF6B35',
          'secondary': '#004E89',
          'accent': '#F5E600',

          'error': '#FF1744',
          'warning': '#FF9100',
          'info': '#00B8D4',
          'success': '#00E676',
        },
      },
      softPastel: {
        dark: false,
        colors: {
          'background': '#FFF0F5',
          'surface': '#FFE4EC',
          'on-background': '#3D1F2E',
          'on-surface': '#3D1F2E',

          'primary': '#D81B60',
          'secondary': '#EC407A',
          'accent': '#F06292',

          'error': '#E91E63',
          'warning': '#FF9800',
          'info': '#B39DDB',
          'success': '#4CAF50',
        },
      },
      lavenderDreams: {
        dark: false,
        colors: {
          'background': '#F7F4FF',
          'surface': '#EDE7F6',
          'on-background': '#2A1A3A',
          'on-surface': '#2A1A3A',

          'primary': '#7B1FA2',
          'secondary': '#8E24AA',
          'accent': '#9C27B0',

          'error': '#E91E63',
          'warning': '#FF9800',
          'info': '#673AB7',
          'success': '#66BB6A',
        },
      },
      mintFresh: {
        dark: false,
        colors: {
          'background': '#F1FFF8',
          'surface': '#E0F7ED',
          'on-background': '#1B2E23',
          'on-surface': '#1B2E23',

          'primary': '#00897B',
          'secondary': '#00796B',
          'accent': '#26A69A',

          'error': '#E57373',
          'warning': '#FFB74D',
          'info': '#4DD0E1',
          'success': '#81C784',
        },
      },
      peachCream: {
        dark: false,
        colors: {
          'background': '#FFF8F0',
          'surface': '#FFE5D9',
          'on-background': '#3A2A1A',
          'on-surface': '#3A2A1A',

          'primary': '#E64A19',
          'secondary': '#FF5722',
          'accent': '#FF7043',

          'error': '#EF5350',
          'warning': '#FFA726',
          'info': '#42A5F5',
          'success': '#66BB6A',
        },
      },
      skyBlush: {
        dark: false,
        colors: {
          'background': '#F0F8FF',
          'surface': '#E1F5FE',
          'on-background': '#1A2A3A',
          'on-surface': '#1A2A3A',

          'primary': '#0277BD',
          'secondary': '#0288D1',
          'accent': '#039BE5',

          'error': '#E57373',
          'warning': '#FFB74D',
          'info': '#4FC3F7',
          'success': '#81C784',
        },
      },
      vanillaLatte: {
        dark: false,
        colors: {
          'background': '#FBF8F3',
          'surface': '#F5F0E8',
          'on-background': '#2A1F12',
          'on-surface': '#2A1F12',

          'primary': '#5D4037',
          'secondary': '#6D4C41',
          'accent': '#795548',

          'error': '#D32F2F',
          'warning': '#F57C00',
          'info': '#1976D2',
          'success': '#388E3C',
        },
      },
      lilacMist: {
        dark: false,
        colors: {
          'background': '#FBF7FF',
          'surface': '#F3E5F5',
          'on-background': '#2A1A2F',
          'on-surface': '#2A1A2F',

          'primary': '#8E24AA',
          'secondary': '#9C27B0',
          'accent': '#AB47BC',

          'error': '#E91E63',
          'warning': '#FF9800',
          'info': '#9C27B0',
          'success': '#66BB6A',
        },
      },
      coralSunset: {
        dark: false,
        colors: {
          'background': '#FFF5F5',
          'surface': '#FFEBE6',
          'on-background': '#3A1A1A',
          'on-surface': '#3A1A1A',

          'primary': '#D32F2F',
          'secondary': '#E53935',
          'accent': '#F44336',

          'error': '#D32F2F',
          'warning': '#F57C00',
          'info': '#1976D2',
          'success': '#388E3C',
        },
      },
      butterscotch: {
        dark: false,
        colors: {
          'background': '#FFFEF5',
          'surface': '#FFF9E6',
          'on-background': '#3A2F0D',
          'on-surface': '#3A2F0D',

          'primary': '#F57C00',
          'secondary': '#FB8C00',
          'accent': '#FF9800',

          'error': '#E57373',
          'warning': '#FFC107',
          'info': '#42A5F5',
          'success': '#66BB6A',
        },
      },
      roseQuartz: {
        dark: false,
        colors: {
          'background': '#FFF5F8',
          'surface': '#F8E8EE',
          'on-background': '#3A1A25',
          'on-surface': '#3A1A25',

          'primary': '#C2185B',
          'secondary': '#D81B60',
          'accent': '#E91E63',

          'error': '#E91E63',
          'warning': '#FF9800',
          'info': '#9C27B0',
          'success': '#66BB6A',
        },
      },
      matrix: {
        dark: true,
        colors: {
          'background': '#000000',
          'surface': '#0B0F0B',
          'on-background': '#00FF41',
          'on-surface': '#00FF41',

          'primary': '#00FF41',
          'secondary': '#00C853',
          'accent': '#76FF03',

          'error': '#FF1744',
          'warning': '#FFEA00',
          'info': '#00E5FF',
          'success': '#00C853',
        },
      },
      tokyoNight: {
        dark: true,
        colors: {
          'background': '#1A1B26',
          'surface': '#16161E',
          'on-background': '#A9B1D6',
          'on-surface': '#A9B1D6',

          'primary': '#7AA2F7',
          'secondary': '#BB9AF7',
          'accent': '#73DACA',

          'error': '#F7768E',
          'warning': '#E0AF68',
          'info': '#7DCFFF',
          'success': '#9ECE6A',
        },
      },
      cyberpunk: {
        dark: true,
        colors: {
          'background': '#0D0221',
          'surface': '#1B1035',
          'on-background': '#F8F8FF',
          'on-surface': '#F8F8FF',

          'primary': '#FF2A6D',
          'secondary': '#05D9E8',
          'accent': '#FAFF00',

          'error': '#FF1744',
          'warning': '#FFB300',
          'info': '#05D9E8',
          'success': '#00F5D4',
        },
      },
      cyberpunkNeon: {
        dark: true,
        colors: {
          'background': '#06020A',
          'surface': '#12081E',
          'on-background': '#F7F4FF',
          'on-surface': '#F7F4FF',

          'primary': '#00F5D4',
          'secondary': '#FF2A6D',
          'accent': '#B6FF00',

          'error': '#FF1744',
          'warning': '#FFB300',
          'info': '#7C4DFF',
          'success': '#00E676',
        },
      },
      synthwave84: {
        dark: true,
        colors: {
          'background': '#262335',
          'surface': '#2A2139',
          'on-background': '#FFFFFF',
          'on-surface': '#FFFFFF',

          'primary': '#FF7EDB',
          'secondary': '#03EDF9',
          'accent': '#FEDE5D',

          'error': '#FE4450',
          'warning': '#FEDE5D',
          'info': '#03EDF9',
          'success': '#72F1B8',
        },
      },
      nebula: {
        dark: true,
        colors: {
          'background': '#0B1020',
          'surface': '#141B2D',
          'on-background': '#E6EDF7',
          'on-surface': '#E6EDF7',

          'primary': '#7C3AED',
          'secondary': '#60A5FA',
          'accent': '#22D3EE',

          'error': '#FB7185',
          'warning': '#FBBF24',
          'info': '#22D3EE',
          'success': '#34D399',
        },
      },
      constellations: {
        dark: true,
        colors: {
          'background': '#070B1A',
          'surface': '#10172A',
          'on-background': '#EAF2FF',
          'on-surface': '#EAF2FF',

          'primary': '#A78BFA',
          'secondary': '#38BDF8',
          'accent': '#FDE047',

          'error': '#FB7185',
          'warning': '#FBBF24',
          'info': '#38BDF8',
          'success': '#4ADE80',
        },
      },
      kawaiiPastel: {
        dark: false,
        colors: {
          'background': '#FFF0F6',
          'surface': '#FFE4F1',
          'on-background': '#4A2C3A',
          'on-surface': '#4A2C3A',

          'primary': '#FF8CCB',
          'secondary': '#FFB3C6',
          'accent': '#FFD6A5',

          'error': '#FF4D6D',
          'warning': '#FFB703',
          'info': '#8ECDF7',
          'success': '#95D5B2',
        },
      },
      zen: {
        dark: false,
        colors: {
          'background': '#F7F3EA',
          'surface': '#F0EBE1',
          'on-background': '#2F3A2F',
          'on-surface': '#2F3A2F',

          'primary': '#6B8F71',
          'secondary': '#A7C4A0',
          'accent': '#C2A878',

          'error': '#B5544B',
          'warning': '#C98B3C',
          'info': '#4C8DAE',
          'success': '#5E9C76',
        },
      },
      motivation: {
        dark: false,
        colors: {
          'background': '#FFF6E8',
          'surface': '#FFFFFF',
          'on-background': '#1F2328',
          'on-surface': '#1F2328',

          'primary': '#FF6B6B',
          'secondary': '#FFD93D',
          'accent': '#4ECDC4',

          'error': '#D64550',
          'warning': '#FF9F1C',
          'info': '#3A86FF',
          'success': '#2EC4B6',
        },
      },
      cozy: {
        dark: true,
        colors: {
          'background': '#1C1410',
          'surface': '#2A1E18',
          'on-background': '#F6E7D8',
          'on-surface': '#F6E7D8',

          'primary': '#D08C60',
          'secondary': '#C9A227',
          'accent': '#8BB174',

          'error': '#E26D5C',
          'warning': '#E9C46A',
          'info': '#7DAEA3',
          'success': '#8BB174',
        },
      },
      melancholy: {
        dark: true,
        colors: {
          'background': '#0B1020',
          'surface': '#101A33',
          'on-background': '#D7E1FF',
          'on-surface': '#D7E1FF',

          'primary': '#6C8CFF',
          'secondary': '#38BDF8',
          'accent': '#A78BFA',

          'error': '#FB7185',
          'warning': '#FBBF24',
          'info': '#38BDF8',
          'success': '#4ADE80',
        },
      },
      academicClean: {
        dark: false,
        colors: {
          'background': '#FFFFFF',
          'surface': '#F6F8FA',
          'on-background': '#24292F',
          'on-surface': '#24292F',

          'primary': '#0969DA',
          'secondary': '#6E7781',
          'accent': '#8250DF',

          'error': '#CF222E',
          'warning': '#9A6700',
          'info': '#0969DA',
          'success': '#1A7F37',
        },
      },
      gamerArena: {
        dark: true,
        colors: {
          'background': '#070A12',
          'surface': '#0E1529',
          'on-background': '#EAF0FF',
          'on-surface': '#EAF0FF',

          'primary': '#00C853',
          'secondary': '#7C4DFF',
          'accent': '#00B8D4',

          'error': '#FF1744',
          'warning': '#FFB300',
          'info': '#00B8D4',
          'success': '#00E676',
        },
      },
      fintechPro: {
        dark: true,
        colors: {
          'background': '#060B14',
          'surface': '#0B1220',
          'on-background': '#E6EEF8',
          'on-surface': '#E6EEF8',

          'primary': '#00D4AA',
          'secondary': '#38BDF8',
          'accent': '#A78BFA',

          'error': '#FB7185',
          'warning': '#FBBF24',
          'info': '#38BDF8',
          'success': '#22C55E',
        },
      },
      urbanStreet: {
        dark: true,
        colors: {
          'background': '#0F1115',
          'surface': '#1A1D24',
          'on-background': '#F5F7FA',
          'on-surface': '#F5F7FA',

          'primary': '#FF3D00',
          'secondary': '#FFD600',
          'accent': '#2979FF',

          'error': '#D32F2F',
          'warning': '#F9A825',
          'info': '#29B6F6',
          'success': '#2E7D32',
        },
      },
      creativeStudio: {
        dark: false,
        colors: {
          'background': '#F8FAFC',
          'surface': '#FFFFFF',
          'on-background': '#1F2933',
          'on-surface': '#1F2933',

          'primary': '#3B82F6',
          'secondary': '#6366F1',
          'accent': '#F59E0B',

          'error': '#DC2626',
          'warning': '#D97706',
          'info': '#2563EB',
          'success': '#16A34A',
        },
      },
      institutional: {
        dark: false,
        colors: {
          'background': '#F4F6F8',
          'surface': '#FFFFFF',
          'on-background': '#1F2933',
          'on-surface': '#1F2933',

          'primary': '#0F2A44',
          'secondary': '#5C6F82',
          'accent': '#C9A227',

          'error': '#B91C1C',
          'warning': '#B45309',
          'info': '#1D4ED8',
          'success': '#15803D',
        },
      },
    },
  },
})
