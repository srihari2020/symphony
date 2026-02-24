import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const darkTheme = {
    '--bg-primary': '#0f0f14',
    '--bg-secondary': '#16161d',
    '--bg-tertiary': '#1e1e28',
    '--bg-card': '#1a1a24',
    '--bg-hover': '#252532',
    '--text-primary': '#ffffff',
    '--text-secondary': '#a0a0b0',
    '--text-tertiary': '#6b6b7b',
    '--accent-primary': '#6366f1',
    '--accent-secondary': '#818cf8',
    '--accent-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    '--success': '#22c55e',
    '--warning': '#f59e0b',
    '--danger': '#ef4444',
    '--border-color': '#2a2a38',
    '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.2)',
    '--shadow-md': '0 4px 20px rgba(0, 0, 0, 0.3)',
    '--shadow-lg': '0 8px 40px rgba(0, 0, 0, 0.4)',
    '--shadow-glow': '0 0 30px rgba(99, 102, 241, 0.25)',
};

const lightTheme = {
    '--bg-primary': '#f5f5f7',
    '--bg-secondary': '#eaeaef',
    '--bg-tertiary': '#ffffff',
    '--bg-card': '#ffffff',
    '--bg-hover': '#e8e8ee',
    '--text-primary': '#1a1a2e',
    '--text-secondary': '#555566',
    '--text-tertiary': '#888899',
    '--accent-primary': '#6366f1',
    '--accent-secondary': '#818cf8',
    '--accent-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    '--success': '#16a34a',
    '--warning': '#d97706',
    '--danger': '#dc2626',
    '--border-color': '#d4d4de',
    '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
    '--shadow-md': '0 4px 20px rgba(0, 0, 0, 0.08)',
    '--shadow-lg': '0 8px 40px rgba(0, 0, 0, 0.12)',
    '--shadow-glow': '0 0 30px rgba(99, 102, 241, 0.15)',
};

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved) {
    const vars = resolved === 'light' ? lightTheme : darkTheme;
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
    // Update body background for light mode (override the gradient)
    if (resolved === 'light') {
        document.body.style.background = `
            radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.06) 0%, transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.06) 0%, transparent 25%),
            linear-gradient(180deg, #f5f5f7 0%, #eaeaef 100%)
        `;
        document.body.style.backgroundAttachment = 'fixed';
    } else {
        document.body.style.background = `
            radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 25%),
            linear-gradient(180deg, #0f0f14 0%, #16161d 100%)
        `;
        document.body.style.backgroundAttachment = 'fixed';
    }
    document.body.style.color = vars['--text-primary'];
}

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem('symphony-theme') || 'dark';
    });

    const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

    // Apply theme on mount and when it changes
    useEffect(() => {
        applyTheme(resolvedTheme);
    }, [resolvedTheme]);

    // Listen for system theme changes when in "system" mode
    useEffect(() => {
        if (theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme(getSystemTheme());
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('symphony-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
