export interface Brand {
  id: string;
  name: string;
  description: string;
  accent: string;
  timezone: string;
}

export const brands: readonly Brand[] = [
  { id: 'tuougm', name: 'TUOUGM', description: '音楽とカルチャーを届ける', accent: '#7150ce', timezone: 'Asia/Tokyo' },
  { id: 're', name: 'RE:NA', description: '新しい視点で、日常をつなぐ', accent: '#176c67', timezone: 'Asia/Tokyo' },
];
