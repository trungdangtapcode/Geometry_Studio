#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: ./make_submission.sh StudentID"
  exit 1
fi

student_id="$1"
archive="${student_id}.zip"

rm -f "$archive"
zip -r "$archive" \
  Readme.txt \
  Doc \
  Release \
  Source \
  -x "Source/node_modules/*" \
  -x "Source/test-results/*" \
  -x "Source/playwright-report/*" \
  -x "Source/*.log"

echo "Created $archive"
