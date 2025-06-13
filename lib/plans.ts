export interface Plan {
  id: string;
  name: string;
  description: string;
  image: string;
  price?: string;
}

export const plans: Plan[] = [
  {
    id: 'basis-model',
    name: 'BASIS MODEL',
    description: 'The fast and reliable model.',
    price: '€4.99',
    image: '/images/ChatGPT Image Jun 8, 2025, 04_07_35 PM.png',
  },
  {
    id: 'plus-model',
    name: 'PLUS MODEL',
    description: 'Very good model capable of most tasks.',
    price: '€9.99',
    image: '/images/ChatGPT Image Jun 8, 2025, 04_08_58 PM.png',
  },
  {
    id: 'top-model',
    name: 'TOP MODEL',
    description: 'Best state of the art model capable of everything.',
    price: '€19.99',
    image: '/images/ChatGPT Image Jun 8, 2025, 04_00_45 PM.png',
  },
  {
    id: 'coming-soon',
    name: 'COMING SOON',
    description: 'New model available soon.',
    image: '/images/ChatGPT Image Jun 8, 2025, 05_03_41 PM.png',
  },
];
