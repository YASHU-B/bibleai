#!/bin/bash
# Validate Audio Bible Setup
# Checks if audio files are properly organized

cd "$(dirname "$0")"

echo "📋 Audio Bible Setup Validation"
echo "================================"
echo ""

if [ ! -d "assets/audio" ]; then
    echo "❌ ERROR: assets/audio directory not found!"
    echo ""
    echo "Setup instructions:"
    echo "1. Create: mkdir -p assets/audio"
    echo "2. Extract ZIP files into: assets/audio/{bookname}/"
    echo "3. Ensure chapter files are named: 1.mp3, 2.mp3, etc."
    exit 1
fi

total_books=0
total_chapters=0

for book_dir in assets/audio/*/; do
    if [ -d "$book_dir" ]; then
        book_name=$(basename "$book_dir")
        chapter_count=$(find "$book_dir" -name "*.mp3" | wc -l)
        
        if [ $chapter_count -gt 0 ]; then
            printf "  %-20s %3d chapters\n" "$book_name:" "$chapter_count"
            total_books=$((total_books + 1))
            total_chapters=$((total_chapters + chapter_count))
        fi
    fi
done

echo ""
echo "Summary:"
echo "--------"
echo "Books with audio: $total_books"
echo "Total chapters: $total_chapters"
echo ""

if [ $total_chapters -gt 0 ]; then
    echo "✓ Audio setup looks good!"
    echo ""
    echo "Sample files:"
    find assets/audio -name "*.mp3" | head -3 | sed 's/^/  /'
else
    echo "❌ No MP3 files found in assets/audio/"
    echo ""
    echo "Make sure:"
    echo "1. ZIP files are extracted to: assets/audio/{bookname}/"
    echo "2. Chapter files are named: 1.mp3, 2.mp3, etc."
    echo "3. Book folder names are lowercase with underscores"
fi
