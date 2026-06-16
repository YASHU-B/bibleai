import { Share } from 'react-native';

export interface ShareVerseData {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  language: 'te' | 'en';
}

export interface BilingualShareVerseData {
  bookName: string;
  chapter: number;
  verse: number;
  text_te: string;
  text_en: string;
}

export const verseShareService = {
  // Share verse via native share sheet
  async shareVerse(data: ShareVerseData) {
    try {
      const isTe = data.language === 'te' || (data.text && /[\u0c00-\u0c7f]/.test(data.text));
      const verseRef = `${data.bookName} ${data.chapter}:${data.verse}`;
      
      const title = isTe ? '✨ *నేటి బైబిల్ వాక్యము* ✨' : '✨ *BIBLE VERSE OF THE DAY* ✨';
      const line = '━━━━━━━━━━━━━━━━━━━━';
      const bookRef = `📖 *${verseRef}*`;
      const cleanText = data.text.replace(/^\s*\d+\s*/, '');
      const verseText = `“ _${cleanText.trim()}_ ”`;
      const footerTitle = isTe ? '🕊️ *ప్రార్థన & ధ్యానము:*' : '🕊️ *Reflection & Prayer:*';
      const footerText = isTe 
        ? 'ఈ దైవ వాక్యము మీ హృదయానికి శాంతిని, దేవుని కృపను మరియు ఆశీర్వాదాలను అనుగ్రహించును గాక. ఆమేన్. 🙏'
        : 'May this holy word guide your path, bring peace to your heart, and fill your day with grace. Amen. 🙏';
      const appLink = isTe 
        ? '📱 *బైబిల్ AI యాప్ ద్వారా*'
        : '📱 *Shared via Bible AI App*';

      const message = `${title}\n${line}\n\n${bookRef}\n\n${verseText}\n\n${line}\n${footerTitle}\n${footerText}\n\n${appLink}`;

      await Share.share({
        message,
        title: isTe ? `వాక్యము: ${verseRef}` : `Verse: ${verseRef}`,
      });
    } catch (error) {
      console.error('Failed to share verse:', error);
    }
  },

  // Share bilingual verse (Telugu + English) in spiritual WhatsApp template
  async shareBilingualVerse(data: BilingualShareVerseData) {
    try {
      const verseRef = `${data.bookName} ${data.chapter}:${data.verse}`;
      const line = '━━━━━━━━━━━━━━━━━━━━';

      // Clean verse numbers from both texts
      const cleanTe = data.text_te.replace(/^\s*\d+\s*/, '').trim();
      const cleanEn = data.text_en.replace(/^\s*\d+\s*/, '').trim();

      const message =
        `✨ *నేటి బైబిల్ వాక్యము* ✨\n` +
        `${line}\n\n` +
        `📖 *${verseRef}*\n\n` +
        `" _${cleanTe}_\n\n` +
        `English:\n${cleanEn}_ "\n\n` +
        `${line}\n` +
        `🕊️ *ప్రార్థన & ధ్యానము:*\n` +
        `ఈ దైవ వాక్యము మీ హృదయానికి శాంతిని, దేవుని కృపను మరియు ఆశీర్వాదాలను అనుగ్రహించును గాక. ఆమేన్. 🙏\n\n` +
        `📱 *బైబిల్ AI యాప్ ద్వారా*`;

      await Share.share({
        message,
        title: `వాక్యము: ${verseRef}`,
      });
    } catch (error) {
      console.error('Failed to share bilingual verse:', error);
    }
  },

  // Share multiple verses
  async shareVerses(verses: ShareVerseData[]) {
    try {
      if (verses.length === 0) return;
      const isTe = verses[0].language === 'te' || (verses[0].text && /[\u0c00-\u0c7f]/.test(verses[0].text));
      
      const title = isTe ? '✨ *పరిశుద్ధ బైబిల్ వాక్యములు* ✨' : '✨ *HOLY BIBLE SCRIPTURES* ✨';
      const line = '━━━━━━━━━━━━━━━━━━━━';
      let message = `${title}\n${line}\n\n`;

      verses.forEach((v) => {
        const verseRef = `${v.bookName} ${v.chapter}:${v.verse}`;
        const cleanText = v.text.replace(/^\s*\d+\s*/, '');
        message += `📖 *${verseRef}*\n“ _${cleanText.trim()}_ ”\n\n`;
      });

      const footerTitle = isTe ? '🕊️ *ప్రార్థన & ధ్యానము:*' : '🕊️ *Reflection & Prayer:*';
      const footerText = isTe 
        ? 'ఈ దైవ వాక్యములు మీ హృదయానికి శాంతిని, దేవుని కృపను మరియు ఆశీర్వాదాలను అనుగ్రహించును గాక. ఆమేన్. 🙏'
        : 'May these holy words guide your path, bring peace to your heart, and fill your day with grace. Amen. 🙏';
      const appLink = isTe 
        ? '📱 *బైబిల్ AI యాప్ ద్వారా*'
        : '📱 *Shared via Bible AI App*';

      message += `${line}\n${footerTitle}\n${footerText}\n\n${appLink}`;

      await Share.share({
        message,
        title: isTe ? 'బైబిల్ వాక్యములు' : 'Bible Scriptures',
      });
    } catch (error) {
      console.error('Failed to share verses:', error);
    }
  },

  // Generate shareable text
  generateShareText(data: ShareVerseData, includeAppName: boolean = true): string {
    const isTe = data.language === 'te' || (data.text && /[\u0c00-\u0c7f]/.test(data.text));
    const verseRef = `${data.bookName} ${data.chapter}:${data.verse}`;
    
    const title = isTe ? '✨ *నేటి బైబిల్ వాక్యము* ✨' : '✨ *BIBLE VERSE OF THE DAY* ✨';
    const line = '━━━━━━━━━━━━━━━━━━━━';
    const bookRef = `📖 *${verseRef}*`;
    const cleanText = data.text.replace(/^\s*\d+\s*/, '');
    const verseText = `“ _${cleanText.trim()}_ ”`;
    const footerTitle = isTe ? '🕊️ *ప్రార్థన & ధ్యానము:*' : '🕊️ *Reflection & Prayer:*';
    const footerText = isTe 
      ? 'ఈ దైవ వాక్యము మీ హృదయానికి శాంతిని, దేవుని కృపను మరియు ఆశీర్వాదాలను అనుగ్రహించును గాక. ఆమేన్. 🙏'
      : 'May this holy word guide your path, bring peace to your heart, and fill your day with grace. Amen. 🙏';
    const appLink = isTe 
      ? '📱 *బైబిల్ AI యాప్ ద్వారా*'
      : '📱 *Shared via Bible AI App*';

    let message = `${title}\n${line}\n\n${bookRef}\n\n${verseText}\n\n${line}`;
    if (includeAppName) {
      message += `\n${footerTitle}\n${footerText}\n\n${appLink}`;
    }
    return message;
  },

  // Share devotional
  async shareDevotional(title: string, content: string, verseRef: string) {
    try {
      const line = '━━━━━━━━━━━━━━━━━━━━';
      const isTe = /[\u0c00-\u0c7f]/.test(title + content);
      
      const header = isTe ? '✨ *నేటి దైవ సందేశం* ✨' : '✨ *DAILY DEVOTIONAL* ✨';
      const appLink = isTe ? '📱 *బైబిల్ AI యాప్ ద్వారా*' : '📱 *Shared via Bible AI App*';

      const message = `${header}\n${line}\n\n*${title}*\n\n_${content}_\n\n📖 *${verseRef}*\n\n${line}\n${appLink}`;

      await Share.share({
        message,
        title: title || 'Devotional',
      });
    } catch (error) {
      console.error('Failed to share devotional:', error);
    }
  },

  // Share prayer request (anonymous)
  async sharePrayerRequest(request: string, category: string) {
    try {
      const line = '━━━━━━━━━━━━━━━━━━━━';
      const isTe = /[\u0c00-\u0c7f]/.test(request);
      
      const title = isTe ? '🙏 *ప్రార్థన విన్నపము* 🙏' : '🙏 *PRAYER REQUEST* 🙏';
      const catLabel = isTe ? `वर्ग: *${category}*` : `Category: *${category}*`;
      const appLink = isTe ? '📱 *బైబిల్ AI కమ్యూనిటీ ద్వారా*' : '📱 *Shared via Bible AI Community*';

      const message = `${title}\n${line}\n${catLabel}\n\n“ _${request.trim()}_ ”\n\n${line}\n${appLink}`;

      await Share.share({
        message,
        title: 'Prayer Request',
      });
    } catch (error) {
      console.error('Failed to share prayer request:', error);
    }
  },
};
