#!/bin/bash
# Script to remove generated artifacts from git index and commit the change.
# Run this locally from the repo root on the cleanup/remove-generated-and-secrets branch.

set -euo pipefail

echo "Removing .next and node_modules from git index (won't delete local files)..."

git rm -r --cached .next || true
git rm -r --cached node_modules || true

# Remove .env.local from index (we already sanitized it in this branch)
git rm --cached .env.local || true

# Ensure .gitignore has been updated (it is in this branch)
git add .gitignore

git commit -m "chore: remove generated files from repo index (.next, node_modules, .env.local)"

echo "Pushed local commit; now push the branch to origin:"

echo "  git push origin cleanup/remove-generated-and-secrets"

echo "After push, open the PR and run the build in CI/staging before merging. Remember to rotate exposed keys.";
