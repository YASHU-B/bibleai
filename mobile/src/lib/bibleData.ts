import { Book, Verse, books, verses } from './bibleData.generated';

export type { Book, Verse };
export { books, verses };

export interface DevotionalMock {
  id: string;
  title_en: string;
  title_te: string;
  verse_reference: string;
  content_en: string;
  content_te: string;
  image_url: string;
  active_date?: string;
}

export interface MotivationalQuote {
  id: string;
  text_en: string;
  text_te: string;
  ref: string;
  active_date?: string;
}

export const devotionalMocks: DevotionalMock[] = [
  {
    id: 'd1',
    title_en: 'Steadfast Trust in Times of Uncertainty',
    title_te: 'అనిశ్చిత సమయాల్లో స్థిరమైన విశ్వాసం',
    verse_reference: 'Proverbs 3:5-6',
    content_en: 'In our modern, fast-paced world, uncertainty surrounds us constantly. Trust the Lord with all your heart. Surrender your understanding and let God direct your paths.',
    content_te: 'నేటి వేగవంతమైన ప్రపంచంలో, అనిశ్చితి మనలను నిరంతరం చుట్టుముడుతుంది. దేవునిపై నమ్మకముంచండి, ఆయన మీ త్రోవలను నడిపిస్తాడు.',
    image_url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&auto=format&fit=crop&q=80',
    active_date: '2026-05-28'
  },
  {
    id: 'd2',
    title_en: 'Grace for Every New Morning',
    title_te: 'ప్రతి కొత్త ఉదయానికి కృప',
    verse_reference: 'Lamentations 3:22-23',
    content_en: 'Each morning you can start again with God’s fresh mercy. His faithfulness is new every day, so set your heart on His goodness and move forward in hope.',
    content_te: 'ప్రతి ఉదయం మీరు దేవుని కొత్త కృపతో మొదలుపెట్టవచ్చు. ఆయన విశ్వసనీయత ప్రతి రోజు కొత్తగా ఉంటుంది, అందువల్ల మీ హృదయాన్ని ఆయన శ్రేయస్సుపై నిలబెట్టుకొని ఆశతో ముందుకు సాగండి.',
    image_url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&auto=format&fit=crop&q=80',
    active_date: '2026-05-29'
  }
];

export const motivationalQuotes: MotivationalQuote[] = [
  {
    id: 'q1',
    text_en: "Seek first the kingdom of God and His righteousness.",
    text_te: 'మీరు ఆయన రాజ్యమును నీతిని మొదట వెదకుడి.',
    ref: 'Matthew 6:33',
    active_date: '2026-05-28'
  },
  {
    id: 'q2',
    text_en: 'The Lord is my shepherd, I lack nothing.',
    text_te: 'యెహోవా నా కాపరి, నాకు లేమి కలుగదు.',
    ref: 'Psalms 23:1',
    active_date: '2026-05-29'
  }
];
