#!/bin/sh
# Copies every services/*/.env.example (and gateway/.env.example) to .env
# if a .env doesn't already exist there. Run this once before `npm run dev`
# or `docker compose up`, then go fill in the real secrets (JWT_SECRET,
# IMAGEKIT_*, CLOUDINARY_*, etc) in each .env file.

set -e
cd "$(dirname "$0")"

copy_if_missing() {
  dir="$1"
  if [ -f "$dir/.env" ]; then
    echo "skip  (already exists): $dir/.env"
  else
    cp "$dir/.env.example" "$dir/.env"
    echo "created: $dir/.env"
  fi
}

copy_if_missing "gateway"
for d in services/*/; do
  copy_if_missing "${d%/}"
done

echo ""
echo "Done. Now edit each .env and fill in real secrets before starting the services."
