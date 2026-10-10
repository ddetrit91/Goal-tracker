import { LocalStorageAdapter } from './localStorage.adapter';
import type { IStorageAdapter } from './storage.interface';

let instance: IStorageAdapter | null = null;

export function getStorageAdapter(): IStorageAdapter {
  if (!instance) {
    // В будущем здесь можно добавить логику выбора между Local и API
    // например: if (import.meta.env.VITE_USE_API === 'true') return new HttpApiAdapter();
    instance = new LocalStorageAdapter();
  }
  return instance;
}

// Утилита для сброса инстанса (полезна для тестов или горячей перезагрузки)
export function resetStorageAdapter() {
  instance = null;
}