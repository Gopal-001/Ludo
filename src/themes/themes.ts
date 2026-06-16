export type ThemePreset = 'classic' | 'dark' | 'neon' | 'nature';

export interface LudoTheme {
  name: string;
  label: string;

  // Board
  boardBackground: string;
  cellBorder: string;
  trackCell: string;
  safeCell: string;

  // Player colors
  red: string;
  green: string;
  yellow: string;
  blue: string;

  // Home area backgrounds
  homeRed: string;
  homeGreen: string;
  homeYellow: string;
  homeBlue: string;

  // Center finish
  centerColor: string;

  // UI
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  accent: string;
  border: string;

  // Dice
  diceFace: string;
  diceDot: string;
  diceShadow: string;
}

export const THEMES: Record<ThemePreset, LudoTheme> = {
  classic: {
    name: 'classic',
    label: '🎲 Classic',
    boardBackground: '#FFFFFF',
    cellBorder: '#A0A0A0', // darker gray
    trackCell: '#F5F5F5',
    safeCell: '#FFFDE7',

    red: '#E53935',
    green: '#43A047',
    yellow: '#FDD835',
    blue: '#1E88E5',

    homeRed: '#FFCDD2',
    homeGreen: '#C8E6C9',
    homeYellow: '#FFF9C4',
    homeBlue: '#BBDEFB',

    centerColor: '#9E9E9E',

    background: '#F0F0F0',
    surface: '#FFFFFF',
    surfaceAlt: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    accent: '#E53935',
    border: '#E0E0E0',

    diceFace: '#FFFFFF',
    diceDot: '#212121',
    diceShadow: '#BDBDBD',
  },

  dark: {
    name: 'dark',
    label: '🌙 Dark',
    boardBackground: '#1E1E2E',
    cellBorder: '#45475A', // lighter border for dark bg
    trackCell: '#181825',
    safeCell: '#2A2A3E',

    red: '#F38BA8',
    green: '#A6E3A1',
    yellow: '#F9E2AF',
    blue: '#89B4FA',

    homeRed: '#3D1F29',
    homeGreen: '#1F3D22',
    homeYellow: '#3D3020',
    homeBlue: '#1F2C3D',

    centerColor: '#45475A',

    background: '#11111B',
    surface: '#1E1E2E',
    surfaceAlt: '#181825',
    text: '#CDD6F4',
    textSecondary: '#A6ADC8',
    accent: '#CBA6F7',
    border: '#313244',

    diceFace: '#313244',
    diceDot: '#CDD6F4',
    diceShadow: '#11111B',
  },

  neon: {
    name: 'neon',
    label: '⚡ Neon',
    boardBackground: '#0D0D0D',
    cellBorder: '#444444', // lighter neon gray
    trackCell: '#111111',
    safeCell: '#1A1A00',

    red: '#FF073A',
    green: '#39FF14',
    yellow: '#FFE000',
    blue: '#00BFFF',

    homeRed: '#2A0010',
    homeGreen: '#002A00',
    homeYellow: '#2A2600',
    homeBlue: '#00102A',

    centerColor: '#333333',

    background: '#050505',
    surface: '#0D0D0D',
    surfaceAlt: '#111111',
    text: '#F0F0F0',
    textSecondary: '#888888',
    accent: '#FFE000',
    border: '#333333',

    diceFace: '#1A1A1A',
    diceDot: '#FFE000',
    diceShadow: '#000000',
  },

  nature: {
    name: 'nature',
    label: '🌿 Nature',
    boardBackground: '#F1E8D0',
    cellBorder: '#A68A64', // darker brown
    trackCell: '#EDE0C4',
    safeCell: '#D4E8C2',

    red: '#C0392B',
    green: '#27AE60',
    yellow: '#E67E22',
    blue: '#2980B9',

    homeRed: '#F9CBBE',
    homeGreen: '#C8E6B0',
    homeYellow: '#FCE5C0',
    homeBlue: '#B8D4E8',

    centerColor: '#8D6E63',

    background: '#E8D5B0',
    surface: '#F5ECD8',
    surfaceAlt: '#EDE0C4',
    text: '#3E2723',
    textSecondary: '#795548',
    accent: '#27AE60',
    border: '#C4A882',

    diceFace: '#F5ECD8',
    diceDot: '#3E2723',
    diceShadow: '#C4A882',
  },
};

export function getTheme(preset: ThemePreset): LudoTheme {
  return THEMES[preset];
}

export function getPlayerColor(theme: LudoTheme, color: string): string {
  return (theme as any)[color] ?? '#888888';
}

export function getHomeColor(theme: LudoTheme, color: string): string {
  return (theme as any)[`home${color.charAt(0).toUpperCase() + color.slice(1)}`] ?? '#EEEEEE';
}
