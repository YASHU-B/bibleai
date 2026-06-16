import { Book } from './bibleData.generated';
import { audioAssetsMap } from './audioAssets';

export function getAudioBookFolderName(bookName?: string): string {
  const name = (bookName ?? '').toString();
  if (name.trim().length === 0) return 'unknown';

  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getAudioAssetUri(bookName: string, chapter: number): string {
  const folder = getAudioBookFolderName(bookName);
  return `asset:/audio/${folder}/${chapter}.mp3`;
}

export function getAudioAssetSource(bookName: string, chapter: number): any {
  const folder = getAudioBookFolderName(bookName);
  const bookMap = audioAssetsMap[folder];
  if (bookMap && bookMap[chapter]) {
    return bookMap[chapter];
  }
  // Fallback to URI for native assets (e.g. if loaded dynamically/natively later)
  return { uri: getAudioAssetUri(bookName, chapter) };
}

export function getBookDisplayName(book: Book): string {
  return `${book.name_te} (${book.name_en})`;
}

