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

function csvEscape(value) {
  if (value == null) return '';
  const escaped = String(value).replace(/"/g, '""');
  return `"${escaped}"`;
}

function writeCsv(filePath, rows) {
  const content = rows.map(row => row.map(csvEscape).join(',')).join('\n');
  fs.writeFileSync(filePath, content, 'utf8');
}

function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/merge-english.js <path-to-asv.csv> [path-to-verses.csv]');
    process.exit(1);
  }

  const asvPath = path.resolve(args[0]);
  const versesPath = path.resolve(args[1] || path.join(__dirname, '..', 'data', 'verses.csv'));

  if (!fs.existsSync(asvPath)) {
    console.error('File not found:', asvPath);
    process.exit(1);
  }

  if (!fs.existsSync(versesPath)) {
    console.error('File not found:', versesPath);
    process.exit(1);
  }

  // Parse ASV file
  const asvText = fs.readFileSync(asvPath, 'utf8');
  const asvRows = parseCsv(asvText);

  // Find header row (should have "Verse ID", "Book Number", etc)
  const asvHeaderIdx = asvRows.findIndex(r =>
    r.length >= 6 &&
    normalizeHeader(r[0]) === 'Verse ID' &&
    normalizeHeader(r[2]) === 'Book Number'
  );

  if (asvHeaderIdx === -1) {
    console.error('Could not find header row in ASV CSV');
    process.exit(1);
  }

  const asvHeaders = asvRows[asvHeaderIdx].map(normalizeHeader);
  const asvData = asvRows.slice(asvHeaderIdx + 1).filter(r => r.length >= 6);

  // Build English text map: (bookId, chapter, verse) -> text
  const englishMap = new Map();
  for (const row of asvData) {
    const rowData = {};
    for (let i = 0; i < asvHeaders.length; i += 1) {
      rowData[asvHeaders[i]] = row[i] ?? '';
    }

    const bookId = parseInt(rowData['Book Number'], 10);
    const chapter = parseInt(rowData['Chapter'], 10);
    const verse = parseInt(rowData['Verse'], 10);
    const text = rowData['Text'] ?? '';

    if (!Number.isNaN(bookId) && !Number.isNaN(chapter) && !Number.isNaN(verse)) {
      const key = `${bookId}:${chapter}:${verse}`;
      englishMap.set(key, text);
    }
  }

  // Parse existing verses CSV
  const versesText = fs.readFileSync(versesPath, 'utf8');
  const versesRows = parseCsv(versesText);

  const versesHeaders = versesRows[0].map(normalizeHeader);
  const versesData = versesRows.slice(1);

  // Merge English text into verses
  let merged = 0;
  for (let i = 0; i < versesData.length; i += 1) {
    const row = versesData[i];
    const rowData = {};
    for (let j = 0; j < versesHeaders.length; j += 1) {
      rowData[versesHeaders[j]] = row[j] ?? '';
    }

    const bookId = parseInt(rowData['book_id'], 10);
    const chapter = parseInt(rowData['chapter'], 10);
    const verse = parseInt(rowData['verse'], 10);

    const key = `${bookId}:${chapter}:${verse}`;
    if (englishMap.has(key)) {
      const englishText = englishMap.get(key);
      const textEnIdx = versesHeaders.indexOf('text_en');
      if (textEnIdx >= 0) {
        versesData[i][textEnIdx] = englishText;
        merged += 1;
      }
    }
  }

  // Write merged verses CSV
  const output = [versesRows[0], ...versesData];
  writeCsv(versesPath, output);

  console.log('Merged:');
  console.log(' - Updated verses.csv with English text from ASV');
  console.log(' - Matched verses:', merged);
  console.log(' - Output:', versesPath);
}

run();
