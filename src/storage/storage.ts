import { type AnalyticsStorageKey, PURCHASE_STORAGE_KEYS } from './keys';

function get(key: AnalyticsStorageKey): string | null {
  return localStorage.getItem(key);
}

function set(key: AnalyticsStorageKey, value: string): void {
  localStorage.setItem(key, value);
}

function removeItem(key: AnalyticsStorageKey): void {
  localStorage.removeItem(key);
}

const localStorageService = {
  get,
  set,
  removeItem,
};

export function clearPaymentStorage(): void {
  PURCHASE_STORAGE_KEYS.forEach((key) => localStorageService.removeItem(key));
}

export default localStorageService;
