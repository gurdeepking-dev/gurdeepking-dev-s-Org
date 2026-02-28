
import { StyleTemplate } from '../types';

export const SAMPLE_STYLES: StyleTemplate[] = [
  {
    id: 'victorian',
    name: 'Victorian Romance',
    imageUrl: 'https://picsum.photos/seed/victorian/800/800',
    prompt: 'A Victorian era oil painting portrait, elegant clothing, soft lighting, masterpiece quality',
    description: 'Classic 19th century elegance',
    autoGenerate: true,
    displayOrder: 1
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Edge',
    imageUrl: 'https://picsum.photos/seed/cyberpunk/800/800',
    prompt: 'Cyberpunk style portrait, neon lights, futuristic city background, high tech aesthetic',
    description: 'Futuristic neon vibes',
    autoGenerate: true,
    displayOrder: 2
  },
  {
    id: 'anime',
    name: 'Studio Ghibli',
    imageUrl: 'https://picsum.photos/seed/ghibli/800/800',
    prompt: 'Studio Ghibli anime style, hand-drawn aesthetic, whimsical atmosphere, vibrant colors',
    description: 'Magical hand-drawn charm',
    autoGenerate: true,
    displayOrder: 3
  }
];
