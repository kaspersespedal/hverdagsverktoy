import AsyncStorage from '@react-native-async-storage/async-storage';
import { REGIONS, RegionStrings, defaultRegion } from './regions';

const STORAGE_KEY = '@hverdagsverktoy_language';

let currentRegion = defaultRegion;

export function getRegion(): string {
  return currentRegion;
}

export function R(): RegionStrings {
  return REGIONS[currentRegion] || REGIONS[defaultRegion];
}

export function setRegion(region: string): void {
  if (REGIONS[region]) {
    currentRegion = region;
    AsyncStorage.setItem(STORAGE_KEY, region).catch(() => {});
  }
}

export async function loadSavedRegion(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && REGIONS[saved]) {
      currentRegion = saved;
    }
  } catch {}
  return currentRegion;
}

export { REGIONS, RegionStrings, defaultRegion };
