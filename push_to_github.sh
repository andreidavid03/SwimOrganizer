#!/bin/bash
cd ~/Projects/SwimOrganizer
git init
git config user.email "andreid094@gmail.com"
git config user.name "Andrei David"
git remote remove origin 2>/dev/null
git remote add origin https://github.com/andreidavid03/SwimOrganizer.git
git branch -M main
git add .
git commit -m "feat: initial setup — Next.js, Supabase schema, auth, UI redesign"
git pull origin main --allow-unrelated-histories --no-edit 2>/dev/null || true
git push -u origin main
echo "Done! Check https://github.com/andreidavid03/SwimOrganizer"
