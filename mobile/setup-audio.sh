#!/bin/bash
# Audio Bible Setup Script
# This script extracts all Bible audio ZIP files into the correct folder structure

# Navigate to mobile directory
cd "$(dirname "$0")"

# Create assets/audio directory if it doesn't exist
mkdir -p assets/audio

# Function to extract a book
extract_book() {
    local book_name=$1
    local zip_file=$2
    
    if [ -f "$zip_file" ]; then
        echo "Extracting $book_name..."
        mkdir -p "assets/audio/$book_name"
        unzip -o "$zip_file" -d "assets/audio/$book_name"
        echo "✓ $book_name extracted"
    else
        echo "⚠ $zip_file not found"
    fi
}

echo "🎵 Setting up Audio Bible files..."
echo ""

# Extract each book (adjust paths based on where your ZIP files are)
# Modify the paths below to match your ZIP file locations

# Old Testament
extract_book "genesis" "~/Downloads/genesis.zip"
extract_book "exodus" "~/Downloads/exodus.zip"
extract_book "leviticus" "~/Downloads/leviticus.zip"
extract_book "numbers" "~/Downloads/numbers.zip"
extract_book "deuteronomy" "~/Downloads/deuteronomy.zip"
# ... add remaining OT books

# New Testament
extract_book "matthew" "~/Downloads/matthew.zip"
extract_book "mark" "~/Downloads/mark.zip"
extract_book "luke" "~/Downloads/luke.zip"
extract_book "john" "~/Downloads/john.zip"
# ... add remaining NT books

echo ""
echo "✓ Audio setup complete!"
echo ""
echo "Verify structure:"
find assets/audio -type f -name "*.mp3" | head -5
echo "..."
echo ""
echo "Total audio files: $(find assets/audio -type f -name "*.mp3" | wc -l)"
