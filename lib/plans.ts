import type { TranslationKey } from '@/lib/i18n';

export interface Plan {
  id: string;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  image: string;
  price?: string;
}

export const plans: Plan[] = [
  {
    id: 'basis-model',
    nameKey: 'basisModelName',
    descriptionKey: 'basisModelDescription',
    price: '€4.99',
    image: '/images/ChatGPT Image Jun 8, 2025, 04_07_35 PM.png',
  },
  {
    id: 'plus-model',
    nameKey: 'plusModelName',
    descriptionKey: 'plusModelDescription',
    price: '€9.99',
    image: '/images/ChatGPT Image Jun 8, 2025, 04_08_58 PM.png',
  },
  {
    id: 'top-model',
    nameKey: 'topModelName',
    descriptionKey: 'topModelDescription',
    price: '€19.99',
    image: '/images/ChatGPT Image Jun 8, 2025, 04_00_45 PM.png',
  },
  {
    id: 'coming-soon',
    nameKey: 'comingSoon',
    descriptionKey: 'comingSoon',
    image: '/images/ChatGPT Image Jun 8, 2025, 05_03_41 PM.png',
  },
];
