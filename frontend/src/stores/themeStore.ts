import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

function applyTheme(t: Theme) {
  if (t === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('theme', t);
}

const saved = (typeof localStorage !== 'undefined' &&
  localStorage.getItem('theme')) as Theme | null;
const initial: Theme = saved === 'dark' ? 'dark' : 'light';

export const useThemeStore = create<ThemeState>((set) => {
  applyTheme(initial);
  return {
    theme: initial,
    toggle: () =>
      set((state) => {
        const next: Theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(next);
        return { theme: next };
      }),
    setTheme: (t: Theme) => {
      applyTheme(t);
      set({ theme: t });
    },
  };
});
