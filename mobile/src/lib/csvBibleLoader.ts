import { Verse, Book } from './bibleData';
import Papa from 'papaparse';

interface BookCSVRow {
  id: string;
  name_en: string;
  name_te: string;
  testament: 'Old' | 'New';
  book_order: string;
}

interface VerseCSVRow {
  book_id: string;
  chapter: string;
  verse: string;
  text_en: string;
  text_te: string;
}

/**
 * Parse books CSV and return Book array
 */
export async function parseBooksCSV(csvText: string): Promise<Book[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const books = (results.data as BookCSVRow[]).map(row => ({
            id: parseInt(row.id),
            name_en: row.name_en,
            name_te: row.name_te,
            testament: row.testament as 'Old' | 'New',
            chaptersCount: 0, // Will be calculated from verses
          }));

          resolve(books.sort((a, b) => a.id - b.id));
        } catch (error: unknown) {
          reject(error);
        }
      },
      error: (error: unknown) => reject(error),
    });
  });
}

/**
 * Parse verses CSV and group by chapter
 * Returns Map<"bookId-chapter", Verse[]>
 */
export async function parseVersesCSV(csvText: string): Promise<Map<string, Verse[]>> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const versesMap = new Map<string, Verse[]>();
          const chapterMap = new Map<string, Set<number>>(); // Track max chapter per book

          (results.data as VerseCSVRow[]).forEach(row => {
            const bookId = parseInt(row.book_id);
            const chapter = parseInt(row.chapter);
            const verse = parseInt(row.verse);
            const key = `${bookId}-${chapter}`;

            // Track max chapter for this book
            const bookKey = `${bookId}`;
            if (!chapterMap.has(bookKey)) {
              chapterMap.set(bookKey, new Set());
            }
            chapterMap.get(bookKey)?.add(chapter);

            // Add verse to chapter group
            if (!versesMap.has(key)) {
              versesMap.set(key, []);
            }

            versesMap.get(key)?.push({
              book_id: bookId,
              chapter,
              verse,
              text_en: row.text_en,
              text_te: row.text_te,
            });
          });

          // Sort verses within each chapter
          versesMap.forEach(verses => {
            verses.sort((a, b) => a.verse - b.verse);
          });

          resolve(versesMap);
        } catch (error: unknown) {
          reject(error);
        }
      },
      error: (error: unknown) => reject(error),
    });
  });
}

/**
 * Calculate chapters count for each book from verses map
 */
export function calculateChapterCounts(
  books: Book[],
  versesMap: Map<string, Verse[]>
): Book[] {
  const chapterCountMap = new Map<number, number>();

  // Count max chapter for each book
  versesMap.forEach((verses, key) => {
    const [bookId] = key.split('-').map(Number);
    const maxChapter = Math.max(...verses.map(v => v.chapter), 0);
    
    const current = chapterCountMap.get(bookId) || 0;
    if (maxChapter > current) {
      chapterCountMap.set(bookId, maxChapter);
    }
  });

  // Update books with chapter counts
  return books.map(book => ({
    ...book,
    chaptersCount: chapterCountMap.get(book.id) || 0,
  }));
}
