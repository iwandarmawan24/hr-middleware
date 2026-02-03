#!/bin/bash

# Quick SFTP Filesystem Check Script
# Usage: ./check-sftp.sh

echo "═══════════════════════════════════════════════════════════"
echo "  SFTP Filesystem - Quick Check"
echo "═══════════════════════════════════════════════════════════"
echo

# 1. Inbound Folder
echo "📥 INBOUND FOLDER (/home/hris/data/inbound)"
echo "───────────────────────────────────────────────────────────"
FILE_COUNT=$(docker exec hris-sftp find /home/hris/data/inbound -type f 2>/dev/null | wc -l)
echo "Total files: $FILE_COUNT"
echo
docker exec hris-sftp ls -lah /home/hris/data/inbound
echo

# 2. Archive Folder
echo "📦 ARCHIVE FOLDER (/home/hris/data/archive)"
echo "───────────────────────────────────────────────────────────"
ARCHIVE_COUNT=$(docker exec hris-sftp find /home/hris/data/archive -type f 2>/dev/null | wc -l)
echo "Total files: $ARCHIVE_COUNT"
echo
docker exec hris-sftp ls -lah /home/hris/data/archive
echo

# 3. All Files (tree view)
echo "🌲 FILE TREE"
echo "───────────────────────────────────────────────────────────"
docker exec hris-sftp find /home/hris/data -type f -exec ls -lh {} \; 2>/dev/null | \
  awk '{printf "%-20s %10s %s\n", $9, $5, $9}' | \
  sed 's|/home/hris/data/||' || echo "No files found"
echo

# 4. Recent Files (by modification time)
echo "🕐 RECENT FILES (Last 10 modified)"
echo "───────────────────────────────────────────────────────────"
docker exec hris-sftp find /home/hris/data -type f -printf '%T@ %p\n' 2>/dev/null | \
  sort -rn | head -10 | \
  while read timestamp file; do
    docker exec hris-sftp ls -lh "$file" 2>/dev/null | \
      awk -v f="$file" '{printf "%-50s %10s %s %s\n", f, $5, $6, $7}'
  done || echo "No recent files"
echo

# 5. File Types Summary
echo "📊 FILE TYPES SUMMARY"
echo "───────────────────────────────────────────────────────────"
docker exec hris-sftp find /home/hris/data -type f 2>/dev/null | \
  sed 's/.*\.//' | sort | uniq -c | sort -rn | \
  awk '{printf "%-15s: %5d files\n", $2, $1}' || echo "No files"
echo

# 6. Disk Usage
echo "💾 DISK USAGE"
echo "───────────────────────────────────────────────────────────"
docker exec hris-sftp du -sh /home/hris/data/* 2>/dev/null || echo "No data"
echo

echo "═══════════════════════════════════════════════════════════"
echo "✅ SFTP check complete!"
echo "═══════════════════════════════════════════════════════════"
echo
echo "💡 Tips:"
echo "  • View file content: docker exec hris-sftp cat /home/hris/data/inbound/filename.csv"
echo "  • Copy to local: docker cp hris-sftp:/home/hris/data/inbound ./local-backup"
echo "  • SFTP access: sftp -P 2222 hris@localhost (password: hrispass)"
