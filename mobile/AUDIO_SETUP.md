# Audio Bible Setup Guide

## Overview
The Audio Bible feature plays pre-recorded MP3 files stored locally in the app. This allows offline playback without needing an internet connection.

## File Structure

You need to organize your audio files in the following structure:

```
mobile/
├── assets/
│   └── audio/
│       ├── genesis/
│       │   ├── 1.mp3
│       │   ├── 2.mp3
│       │   └── ... (50 chapters)
│       ├── exodus/
│       │   ├── 1.mp3
│       │   ├── 2.mp3
│       │   └── ... (40 chapters)
│       ├── leviticus/
│       │   └── ... (27 chapters)
│       ├── matthew/
│       │   └── ... (28 chapters)
│       ├── mark/
│       │   └── ... (16 chapters)
│       └── ... (all 66 books)
```

## Setup Instructions

### Step 1: Create Assets Directory
```bash
cd mobile
mkdir -p assets/audio
```

### Step 2: Extract Your ZIP Files

For each book ZIP file you have:

```bash
# Example: Genesis
unzip genesis.zip -d assets/audio/genesis/

# Example: Matthew
unzip matthew.zip -d assets/audio/matthew/
```

This should result in:
```
assets/audio/genesis/1.mp3
assets/audio/genesis/2.mp3
... etc
```

### Step 3: Verify File Names

Ensure chapter files are named as numbers only:
- ✅ Correct: `1.mp3`, `2.mp3`, `3.mp3`
- ❌ Incorrect: `genesis_1.mp3`, `chapter_1.mp3`

### Step 4: Update Book Names in Code (if needed)

The app expects book names to match this format:
- Use underscores for spaces: `1_samuel` → `1_samuel`
- Use lowercase: `Genesis` → `genesis`

If your ZIP filenames don't match the book names in `audioConfig.ts`, rename them accordingly.

## Book Names Mapping

The app expects these exact book folder names (as lowercase with underscores):

### Old Testament
- `genesis` - 50 chapters
- `exodus` - 40 chapters
- `leviticus` - 27 chapters
- `numbers` - 36 chapters
- `deuteronomy` - 34 chapters
- `joshua` - 24 chapters
- `judges` - 21 chapters
- `ruth` - 4 chapters
- `1_samuel` - 31 chapters
- `2_samuel` - 24 chapters
- `1_kings` - 22 chapters
- `2_kings` - 25 chapters
- `1_chronicles` - 29 chapters
- `2_chronicles` - 36 chapters
- `ezra` - 10 chapters
- `nehemiah` - 13 chapters
- `esther` - 10 chapters
- `job` - 42 chapters
- `psalms` - 150 chapters
- `proverbs` - 31 chapters
- `ecclesiastes` - 12 chapters
- `isaiah` - 66 chapters
- `jeremiah` - 52 chapters
- `lamentations` - 5 chapters
- `ezekiel` - 48 chapters
- `daniel` - 12 chapters
- `hosea` - 14 chapters
- `joel` - 3 chapters
- `amos` - 9 chapters
- `obadiah` - 1 chapter
- `jonah` - 4 chapters
- `micah` - 7 chapters
- `nahum` - 3 chapters
- `habakkuk` - 3 chapters
- `zephaniah` - 3 chapters
- `haggai` - 2 chapters
- `zechariah` - 14 chapters
- `malachi` - 4 chapters

### New Testament
- `matthew` - 28 chapters
- `mark` - 16 chapters
- `luke` - 24 chapters
- `john` - 21 chapters
- `acts` - 28 chapters
- `romans` - 16 chapters
- `1_corinthians` - 16 chapters
- `2_corinthians` - 13 chapters
- `galatians` - 6 chapters
- `ephesians` - 6 chapters
- `philippians` - 4 chapters
- `colossians` - 4 chapters
- `1_thessalonians` - 5 chapters
- `2_thessalonians` - 3 chapters
- `1_timothy` - 6 chapters
- `2_timothy` - 4 chapters
- `titus` - 3 chapters
- `philemon` - 1 chapter
- `hebrews` - 13 chapters
- `james` - 5 chapters
- `1_peter` - 5 chapters
- `2_peter` - 3 chapters
- `1_john` - 5 chapters
- `2_john` - 1 chapter
- `3_john` - 1 chapter
- `jude` - 1 chapter
- `revelation` - 22 chapters

## Testing

After setting up the files:

1. Run the app: `npm start`
2. Tap the **Audio** tab
3. Select a book and chapter
4. Tap "Play Chapter"
5. Audio should play if files are in the correct location

## Troubleshooting

### Audio files not found
- Check folder names are lowercase with underscores
- Verify chapter files are named `1.mp3`, `2.mp3`, etc.
- On Android, files should be in `assets/audio/`
- On iOS, you may need to bundle files differently

### Audio service error
- Ensure `expo-av` is installed: `npm install expo-av`
- Check file paths in the Android logs

## Android Build Note

When building the APK/AAB:
- Audio files in `assets/` are automatically included
- They'll be accessible at `file:///android_asset/audio/`
- No additional configuration needed

## iOS Build Note

For iOS, you may need to:
1. Add audio files to Xcode directly
2. Or use a different file storage approach
3. Update `audioConfig.ts` to use a different path for iOS

Contact the development team for iOS-specific setup if needed.
