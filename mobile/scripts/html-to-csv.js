const fs = require('fs');
const path = require('path');

const englishBookNames = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
  15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
  20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
  24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel', 28: 'Hosea',
  29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah', 33: 'Micah', 34: 'Nahum',
  35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai', 38: 'Zechariah', 39: 'Malachi',
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
  45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians',
  49: 'Ephesians', 50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians',
  53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy', 56: 'Titus',
  57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter', 61: '2 Peter',
  62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude', 66: 'Revelation',
};

function decodeEntities(value) {
  return String(value)
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '');
}

function parseBookName(html) {
  const match = html.match(/<h1>([^<]+)<\/h1>/i);
  if (!match) return '';
  return decodeEntities(stripTags(match[1].trim()));
}

function parseChapterVerses(html) {
  const textBodyStart = html.indexOf('<div class="textBody" id="textBody">');
  if (textBodyStart === -1) {
    return [];
  }

  const textBody = html.slice(textBodyStart);
  const textEnd = textBody.indexOf('</div>');
  const bodyHtml = textEnd === -1 ? textBody : textBody.slice(0, textEnd);

  const parts = bodyHtml.split('<span class="verse" id="').slice(1);
  const verses = [];

  for (const part of parts) {
    const idMatch = part.match(/^(\d+)">/);
    if (!idMatch) continue;
    const verseNumber = Number(idMatch[1]);
    const remainder = part.slice(idMatch[0].length);
    const nextVerseIndex = remainder.indexOf('<span class="verse" id="');
    const verseHtml = nextVerseIndex === -1 ? remainder : remainder.slice(0, nextVerseIndex);
    let text = verseHtml.replace(/<br\s*\/?>(\s*)/gi, ' ');
    text = decodeEntities(stripTags(text));
    text = text.replace(/\s+/g, ' ').trim();
    if (text.length === 0) continue;
    verses.push({ verse: verseNumber, text });
  }

  return verses;
}

function writeCsv(filePath, rows) {
  const content = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
}

function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/html-to-csv.js <path-to-html-root> [output-folder]');
    process.exit(1);
  }

  const inputFolder = path.resolve(args[0]);
  const outputFolder = path.resolve(args[1] || path.join(__dirname, '..', 'data'));

  if (!fs.existsSync(inputFolder)) {
    console.error('HTML source folder not found:', inputFolder);
    process.exit(1);
  }

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const bookDirs = fs.readdirSync(inputFolder)
    .filter(name => /^\d+$/.test(name) && fs.statSync(path.join(inputFolder, name)).isDirectory())
    .sort((a, b) => Number(a) - Number(b));

  const books = [];
  const verses = [];

  for (const bookDir of bookDirs) {
    const bookId = Number(bookDir);
    const bookPath = path.join(inputFolder, bookDir);
    const chapterFiles = fs.readdirSync(bookPath)
      .filter(name => name.endsWith('.htm'))
      .sort((a, b) => Number(a.replace(/\.htm$/, '')) - Number(b.replace(/\.htm$/, '')));

    if (chapterFiles.length === 0) continue;

    let bookNameTe = '';
    const testament = bookId <= 39 ? 'Old' : 'New';

    for (const fileName of chapterFiles) {
      const chapter = Number(fileName.replace(/\.htm$/, ''));
      const html = fs.readFileSync(path.join(bookPath, fileName), 'utf8');

      if (!bookNameTe) {
        bookNameTe = parseBookName(html) || '';
      }

      const chapterVerses = parseChapterVerses(html);
      for (const verseItem of chapterVerses) {
        verses.push({
          book_id: bookId,
          chapter,
          verse: verseItem.verse,
          text_en: '',
          text_te: verseItem.text,
        });
      }
    }

    books.push({
      id: bookId,
      name_en: englishBookNames[bookId] || '',
      name_te: bookNameTe,
      testament,
      book_order: bookId,
    });
  }

  books.sort((a, b) => a.id - b.id);
  verses.sort((a, b) => a.book_id - b.book_id || a.chapter - b.chapter || a.verse - b.verse);

  const booksRows = [['id', 'name_en', 'name_te', 'testament', 'book_order']].concat(
    books.map(book => [book.id, book.name_en, book.name_te, book.testament, book.book_order])
  );
  const versesRows = [['book_id', 'chapter', 'verse', 'text_en', 'text_te']].concat(
    verses.map(v => [v.book_id, v.chapter, v.verse, v.text_en, v.text_te])
  );

  writeCsv(path.join(outputFolder, 'books.csv'), booksRows);
  writeCsv(path.join(outputFolder, 'verses.csv'), versesRows);

  console.log('Generated Bible CSV from HTML source:');
  console.log(' - books:', books.length);
  console.log(' - verses:', verses.length);
  console.log(' - output folder:', outputFolder);
}

run();
