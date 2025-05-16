#!/bin/bash

# Auto commit script with error handling and logging
LOG_FILE="auto-commit.log"

# Function to log messages with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to get changed files with their status
get_changed_files() {
    git status --porcelain | while read -r line; do
        status=${line:0:2}
        file=${line:3}
        case $status in
            "A ") echo "added $file";;
            "M "|" M") echo "modified $file";;
            "D ") echo "deleted $file";;
            "R ") echo "renamed $file";;
            "??"*) echo "added $file";;
        esac
    done
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        echo "ERROR: Not in a git repository"
        exit 1
    fi
}

# Main execution loop
main() {
    echo "Auto-commit script started. Watching for ALL file changes..."
    
    # Check if we're in a git repository
    check_git_repo
    
    # Store last known state
    last_state=$(git status --porcelain)
    
    while true; do
        # Get current state
        current_state=$(git status --porcelain)
        
        # If state has changed
        if [ "$current_state" != "$last_state" ]; then
            # Check if there are changes
            if [ -n "$current_state" ]; then
                # Stage all changes including deletions
                git add -A
                
                # Get list of changed files with their status
                changed_files=$(get_changed_files)
                
                # If there are changed files
                if [ -n "$changed_files" ]; then
                    # Create commit for each change
                    while IFS= read -r change; do
                        git commit -m "$change" > /dev/null 2>&1
                    done <<< "$changed_files"
                    
                    echo "Changes committed:"
                    echo "$changed_files"
                fi
            fi
            
            # Update last known state
            last_state=$current_state
        fi
        
        # Wait for 1 second before checking again
        sleep 1
    done
}

# Execute main function
main