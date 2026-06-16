const fs = require('fs');
const path = require('path');

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

function normalizeHeader(header) {
  return header.trim().replace(/^"|"$/g, '');
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function run() {
  const args = process.argv.slice(2);
  const outputFolder = path.resolve(args[0] || path.join(__dirname, '..', 'data'));
  const dataFolder = path.resolve(path.join(__dirname, '..', 'data'));

  const booksPath = path.join(dataFolder, 'books.csv');
  const versesPath = path.join(dataFolder, 'verses.csv');
  const outputPath = path.join(outputFolder, 'bibleData.json');

  if (!fs.existsSync(booksPath)) {
    console.error('Missing books.csv at', booksPath);
    process.exit(1);
  }

  if (!fs.existsSync(versesPath)) {
    console.error('Missing verses.csv at', versesPath);
    process.exit(1);
  }

  const booksText = fs.readFileSync(booksPath, 'utf8');
  const versesText = fs.readFileSync(versesPath, 'utf8');

  const bookRows = parseCsv(booksText).filter(r => r.length > 0);
  const verseRows = parseCsv(versesText).filter(r => r.length > 0);

  const bookHeaders = bookRows[0].map(normalizeHeader);
  const verseHeaders = verseRows[0].map(normalizeHeader);

  const books = bookRows.slice(1).map(row => {
    const rowData = {};
    for (let i = 0; i < bookHeaders.length; i += 1) {
      rowData[bookHeaders[i]] = row[i] ?? '';
    }

    return {
      id: Number(rowData.id),
      name_en: String(rowData.name_en),
      name_te: String(rowData.name_te),
      testament: String(rowData.testament),
      chaptersCount: Number(rowData.chaptersCount || rowData.book_order || 0),
    };
  });

  const verses = verseRows.slice(1).map(row => {
    const rowData = {};
    for (let i = 0; i < verseHeaders.length; i += 1) {
      rowData[verseHeaders[i]] = row[i] ?? '';
    }

    return {
      book_id: Number(rowData.book_id),
      chapter: Number(rowData.chapter),
      verse: Number(rowData.verse),
      text_en: String(rowData.text_en),
      text_te: String(rowData.text_te),
    };
  });

  writeJson(outputPath, { books, verses });
  console.log('Generated JSON Bible data at', outputPath);
  console.log(' - books:', books.length);
  console.log(' - verses:', verses.length);
}

run();
