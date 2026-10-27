#!/bin/bash
# Restore the Disnotes demo data from the golden seed (~/disnotes/seed).
# The app reads its CSVs from disk on every request, so restored data
# takes effect immediately — no restart needed. Runs every 5 minutes
# from cron and once at service start, so visitor edits never persist.
mkdir -p ~/disnotes/data
cp ~/disnotes/seed/*.csv ~/disnotes/data/
