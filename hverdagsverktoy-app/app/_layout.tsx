import React, { useEffect, useState, createContext, useContext } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, Theme, defaultTheme } from '../lib/themes';
import { R, setRegion, loadSavedRegion, REGIONS, RegionStrings } from '../lib/i18n';
import { Ionicons } from '@expo/vector-icons';

interface AppContextType {
  theme: Theme;
  themeKey: string;
  setThemeKey: (key: string) => void;
  region: string;
  setRegionKey: (key: string) => void;
  r: RegionStrings;
}

export const AppContext = createContext<AppContextType>({
  theme: themes[defaultTheme],
  themeKey: defaultTheme,
  setThemeKey: () => {},
  region: 'no',
  setRegionKey: () => {},
  r: REGIONS.no,
});

export function useApp() {
  return useContext(AppContext);
}

const THEME_STORAGE_KEY = '@hverdagsverktoy_theme';

export default function RootLayout() {
  const [themeKey, setThemeKeyState] = useState(defaultTheme);
  const [region, setRegionState] = useState('no');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && themes[savedTheme]) {
          setThemeKeyState(savedTheme);
        }
        const savedRegion = await loadSavedRegion();
        setRegionState(savedRegion);
      } catch {}
      setReady(true);
    })();
  }, []);

  const handleSetTheme = (key: string) => {
    if (themes[key]) {
      setThemeKeyState(key);
      AsyncStorage.setItem(THEME_STORAGE_KEY, key).catch(() => {});
    }
  };

  const handleSetRegion = (key: string) => {
    setRegion(key);
    setRegionState(key);
  };

  const theme = themes[themeKey] || themes[defaultTheme];
  const r = REGIONS[region] || REGIONS.no;

  if (!ready) return null;

  return (
    <AppContext.Provider
      value={{
        theme,
        themeKey,
        setThemeKey: handleSetTheme,
        region,
        setRegionKey: handleSetRegion,
        r,
      }}
    >
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.ink3,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: r.dashHome,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calculator"
          options={{
            title: r.tabBasic,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calculator-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mortgage"
          options={{
            title: r.tabMor,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tax"
          options={{
            title: r.tabSal,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="receipt-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="vat"
          options={{
            title: r.tabVat,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pricetag-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analysis"
          options={{
            title: r.tabNpv,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trending-up-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </AppContext.Provider>
  );
}
