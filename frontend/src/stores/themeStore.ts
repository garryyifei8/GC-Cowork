import { create } from 'zustand';

type Theme = 'light';

interface ThemeState {
  theme: Theme;
}

// Always light mode — remove any lingering dark class
const init = () => {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
};

export const useThemeStore = create<ThemeState>(() => {
  init();
  return { theme: 'light' };
});
