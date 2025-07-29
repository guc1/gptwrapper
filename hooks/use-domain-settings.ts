'use client';
import { useEffect, useState } from 'react';

export interface DomainSettings {
  local_dev: boolean;
  creators: Array<string>;
  generation_count: number;
}

const DEFAULT_SETTINGS: DomainSettings = {
  local_dev: false,
  creators: [],
  generation_count: 1,
};

export function useDomainSettings() {
  const [settings, setSettings] = useState<DomainSettings>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('domain-settings');
      if (stored) {
        try {
          return JSON.parse(stored) as DomainSettings;
        } catch {
          return DEFAULT_SETTINGS;
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('domain-settings', JSON.stringify(settings));
    }
  }, [settings]);

  return { settings, setSettings };
}
