#!/bin/bash

echo "🔄 Adding changes..."
git add .

echo "✍ Committing..."
git commit -m "Auto commit by script"

echo "🚀 Pushing to GitHub..."
git push origin main
