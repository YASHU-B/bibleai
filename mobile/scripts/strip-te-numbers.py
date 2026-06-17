#!/usr/bin/env python3
"""
Strip leading verse numbers from text_te fields.
Pattern: "3 దేవుడు..." -> "దేవుడు..."
"""
import re
import json
import sys
import os

def strip_te_number(text):
    """Remove leading number + space from a Telugu text string."""
    if not text:
        return text
    # Match: optional whitespace, then digits, then one or more spaces at start
    return re.sub(r'^\s*\d+\s+', '', text)

# ── 1. Fix bibleData.json ──────────────────────────────────────────────────
json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'bibleData.json')
print(f"Reading {json_path} ...")
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

changed = 0
for verse in data.get('verses', []):
    original = verse.get('text_te', '')
    cleaned = strip_te_number(original)
    if cleaned != original:
        verse['text_te'] = cleaned
        changed += 1

print(f"Fixed {changed} text_te entries in bibleData.json")
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Saved bibleData.json ✅")

# ── 2. Fix bibleData.generated.ts (raw regex replacement) ──────────────────
ts_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'lib', 'bibleData.generated.ts')
print(f"\nReading {ts_path} ...")
with open(ts_path, 'r', encoding='utf-8') as f:
    content = f.read()

# In the TS file, text_te values appear as:  text_te: "3 దేవుడు..."
# We replace: text_te: "DIGITS SPACE  ->  text_te: "
pattern = re.compile(r'(text_te:\s*")(\d+\s+)')
new_content, ts_changed = pattern.subn(r'\1', content)

print(f"Fixed {ts_changed} text_te entries in bibleData.generated.ts")
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Saved bibleData.generated.ts ✅")

# ── 3. Fix verses.csv ──────────────────────────────────────────────────────
csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'verses.csv')
if os.path.exists(csv_path):
    print(f"\nReading {csv_path} ...")
    with open(csv_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    csv_changed = 0
    fixed_lines = []
    for line in lines:
        # CSV columns: book_id,chapter,verse,text_te,text_en  (or similar)
        # We strip leading number+space from any Telugu column value
        new_line = re.sub(r'(,")(\d+\s+)', r'\1', line)
        if new_line != line:
            csv_changed += 1
        fixed_lines.append(new_line)
    
    with open(csv_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    print(f"Fixed {csv_changed} entries in verses.csv ✅")

print("\n✅ All done!")
