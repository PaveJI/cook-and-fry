#!/bin/bash
set -e

SRC="/home/pasha/cook-and-fry/frontend"
DEST="/var/www/cook-and-fry"

mkdir -p "$DEST"
cp -r "$SRC"/* "$DEST"

echo "Frontend deployed from $SRC to $DEST"
