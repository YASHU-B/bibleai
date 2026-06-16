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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function csvEscape(value) {
  if (value == null) return '';
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
}

function normalizeHeader(header) {
  return header.trim().replace(/^"|"$/g, '');
}

function writeCsv(filePath, rows) {
  const content = rows.map(row => row.map(csvEscape).join(',')).join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
}

function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/convert-te-irv.js <path-to-te_irv.csv> [output-folder]');
    process.exit(1);
  }

  const inputPath = path.resolve(args[0]);
  const outputFolder = path.resolve(args[1] || path.join(__dirname, '..', 'data'));

  if (!fs.existsSync(inputPath)) {
    console.error('File not found:', inputPath);
    process.exit(1);
  }

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const text = fs.readFileSync(inputPath, 'utf8');
  const rows = parseCsv(text);

  const headerIndex = rows.findIndex(r => r.length >= 6 && normalizeHeader(r[0]) === 'Verse ID' && normalizeHeader(r[1]) === 'Book Name');
  if (headerIndex === -1) {
    console.error('Could not find header row in CSV');
    process.exit(1);
  }

  const headers = rows[headerIndex].map(normalizeHeader);
  const dataRows = rows.slice(headerIndex + 1).filter(r => r.length >= 6);

  const bookMap = new Map();
  const verses = [];

  for (const row of dataRows) {
    const rowData = {};
    for (let i = 0; i < headers.length; i += 1) {
      rowData[headers[i]] = row[i] ?? '';
    }

    const bookId = parseInt(rowData['Book Number'], 10);
    if (Number.isNaN(bookId)) continue;

    const chapter = parseInt(rowData['Chapter'], 10);
    const verse = parseInt(rowData['Verse'], 10);
    const textTe = rowData['Text'] ?? rowData['Telugu Text'] ?? '';
    const textEn = rowData['Text (English)'] ?? rowData['Text English'] ?? rowData['English Text'] ?? '';
    const bookNameTelugu = rowData['Book Name'] ?? '';

    if (!bookMap.has(bookId)) {
      bookMap.set(bookId, {
        id: bookId,
        name_en: englishBookNames[bookId] || '',
        name_te: bookNameTelugu,
        testament: bookId <= 39 ? 'Old' : 'New',
        book_order: bookId,
      });
    }

    verses.push({
      book_id: bookId,
      chapter,
      verse,
      text_en: textEn || textTe,
      text_te: textTe,
    });
  }

  const books = Array.from(bookMap.values()).sort((a, b) => a.id - b.id);

  const booksCsv = [['id', 'name_en', 'name_te', 'testament', 'book_order'],
    ...books.map(book => [book.id, book.name_en, book.name_te, book.testament, book.book_order])];

  const versesCsv = [['book_id', 'chapter', 'verse', 'text_en', 'text_te'],
    ...verses.map(v => [v.book_id, v.chapter, v.verse, v.text_en, v.text_te])];

  writeCsv(path.join(outputFolder, 'books.csv'), booksCsv);
  writeCsv(path.join(outputFolder, 'verses.csv'), versesCsv);

  console.log('Generated:');
  console.log(' -', path.join(outputFolder, 'books.csv'));
  console.log(' -', path.join(outputFolder, 'verses.csv'));
  console.log('Rows:', verses.length, 'verses,', books.length, 'books');
}

run();
