import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AppVisualSettings {
  // Appearance & Theme
  accentColor: string;
  glassIntensity: number; // 0 to 100
  animationSpeed: number; // 25 to 200 (%)
  compactMode: boolean;
  sidebarDensity: 'Comfortable' | 'Compact' | 'Dense';
  fontSize: 'Small' | 'Medium' | 'Large';
  monospaceFont: string;
  reduceMotion: boolean;
  showParticles: boolean;
  particleDensity: number; // 20 to 150
  ambientGlow: boolean;

  // General & Workspace
  launchOnStartup: boolean;
  openLastWorkspace: boolean;
  autoCheckUpdates: boolean;
  showWelcomeScreen: boolean;
  confirmCloseRecording: boolean;
  minimizeToTray: boolean;
  defaultLandingPage: string;

  // Notifications
  desktopNotifications: boolean;
  notifyRecordingStarted: boolean;
  notifyRecordingFinished: boolean;
  notifyAiProcessingDone: boolean;

  // Recording & Hardware
  audioInputDevice: string;
  audioOutputDevice: string;
  recordingFormat: string;
  sampleRate: string;
  bitDepth: string;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  agcControl: boolean;
  speakerDiarizationSetting: boolean;

  // Storage & Privacy
  runOffline: boolean;
  disableTelemetry: boolean;
  encryptDatabase: boolean;
}

export const DEFAULT_VISUAL_SETTINGS: AppVisualSettings = {
  accentColor: '#8B5CF6',
  glassIntensity: 75,
  animationSpeed: 100,
  compactMode: false,
  sidebarDensity: 'Comfortable',
  fontSize: 'Medium',
  monospaceFont: 'JetBrains Mono',
  reduceMotion: false,
  showParticles: true,
  particleDensity: 80,
  ambientGlow: true,

  launchOnStartup: true,
  openLastWorkspace: true,
  autoCheckUpdates: true,
  showWelcomeScreen: true,
  confirmCloseRecording: true,
  minimizeToTray: true,
  defaultLandingPage: 'Dashboard',

  desktopNotifications: true,
  notifyRecordingStarted: true,
  notifyRecordingFinished: true,
  notifyAiProcessingDone: true,

  audioInputDevice: 'Default System Microphone',
  audioOutputDevice: 'Default Speakers (Realtek High Definition)',
  recordingFormat: 'WAV (Uncompressed PCM)',
  sampleRate: '16000',
  bitDepth: '16-bit Float',
  noiseSuppression: true,
  echoCancellation: true,
  agcControl: true,
  speakerDiarizationSetting: true,

  runOffline: true,
  disableTelemetry: true,
  encryptDatabase: true,
};

const SETTINGS_STORAGE_KEY = 'samvad_app_settings_v2';

interface SettingsContextType {
  settings: AppVisualSettings;
  updateSettings: (newSettings: Partial<AppVisualSettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppVisualSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_VISUAL_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to parse saved settings, falling back to defaults:', e);
    }
    return DEFAULT_VISUAL_SETTINGS;
  });

  // Apply CSS Variables & Root DOM Classes whenever settings change
  useEffect(() => {
    const root = document.documentElement;

    // 1. Accent Color & Glow
    root.style.setProperty('--accent-primary', settings.accentColor);
    root.style.setProperty('--accent-glow', `${settings.accentColor}50`);
    root.style.setProperty('--shadow-glow-sky', settings.ambientGlow ? `0 0 25px ${settings.accentColor}40` : 'none');

    // 2. Glass Intensity & Blur
    const blurPx = settings.glassIntensity > 0 ? `${(settings.glassIntensity / 100) * 20}px` : '0px';
    const glassBgOpacity = (settings.glassIntensity / 100) * 0.9 + 0.1;
    root.style.setProperty('--glass-blur', blurPx);
    root.style.setProperty('--glass-bg-opacity', glassBgOpacity.toString());

    // 3. Animation Speed Multiplier
    const durationMultiplier = settings.reduceMotion ? 0.001 : 100 / settings.animationSpeed;
    root.style.setProperty('--duration-normal', `${250 * durationMultiplier}ms`);
    root.style.setProperty('--duration-fast', `${150 * durationMultiplier}ms`);
    root.style.setProperty('--duration-slow', `${400 * durationMultiplier}ms`);

    // 4. Compact Mode & Root Classes
    if (settings.compactMode) {
      root.classList.add('compact-layout');
    } else {
      root.classList.remove('compact-layout');
    }

    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // 5. Font Scale
    const fontSizeMap = { Small: '13px', Medium: '14px', Large: '15px' };
    root.style.setProperty('--base-font-size', fontSizeMap[settings.fontSize] || '14px');

    // 6. Monospace Font Family
    root.style.setProperty('--font-mono-family', `'${settings.monospaceFont}', monospace`);

    // Save to LocalStorage
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage:', e);
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppVisualSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_VISUAL_SETTINGS);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
