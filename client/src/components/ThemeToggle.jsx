import { useTheme } from '../hooks/useTheme';

const THEME_INFO = {
  auto: { icon: '🖥️', label: 'Auto' },
  light: { icon: '☀️', label: 'Light' },
  dark: { icon: '🌙', label: 'Dark' },
};

function ThemeToggle() {
  const { themeSetting, cycleTheme } = useTheme();
  const info = THEME_INFO[themeSetting];

  return (
    <button
      type="button"
      className="btn btn-outline-secondary theme-toggle"
      onClick={cycleTheme}
      title={`Theme: ${info.label} (click to change)`}
      aria-label={`Theme: ${info.label}. Click to change theme.`}
    >
      <span aria-hidden="true">{info.icon}</span>
      <span className="d-lg-none ms-2" aria-hidden="true">
        Theme: {info.label}
      </span>
    </button>
  );
}

export default ThemeToggle;
