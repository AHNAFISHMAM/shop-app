#!/bin/bash
# Auto-rebase script to fix problematic commits

# Set editor to a script that will automatically edit the rebase todo
export GIT_SEQUENCE_EDITOR="sed -i 's/^pick b3e9d28/reword b3e9d28/; s/^pick de3cc16/drop de3cc16/'"

# Start rebase from before the problematic commits
git rebase -i 2d5baa0^

# If reword is needed, set commit message
export GIT_EDITOR="echo 'chore: update project files' >"

