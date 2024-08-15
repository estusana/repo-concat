#!/bin/bash

# GitHub Folder Concatenator
# This script recursively downloads and concatenates all files from a GitHub repository folder

# Check if required tools are installed
check_requirements() {
    local missing_tools=()
    
    for tool in curl jq mktemp; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo "Error: The following required tools are missing:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo "Please install them using Homebrew:"
        echo "  brew install ${missing_tools[*]}"
        exit 1
    fi
}

# Display usage information
show_usage() {
    echo "Usage: $0 <github_url> [output_file] [--exclude pattern1,pattern2,...]"
    echo ""
    echo "Examples:"
    echo "  $0 https://github.com/user/repo/tree/main/src"
    echo "  $0 https://github.com/user/repo/tree/branch/folder concatenated.txt"
    echo "  $0 https://github.com/user/repo/tree/main/src output.txt --exclude __tests__,node_modules"
    echo ""
    echo "Options:"
    echo "  --exclude   Comma-separated list of patterns to exclude (supports * wildcard)"
    echo ""
    echo "If output_file is not specified, the result will be printed to stdout."
    exit 1
}

# Parse GitHub URL into owner, repo, branch, and path
parse_github_url() {
    local url="$1"
    
    # Extract the components from the URL
    if [[ "$url" =~ github\.com/([^/]+)/([^/]+)/tree/([^/]+)(/(.+))? ]]; then
        OWNER="${BASH_REMATCH[1]}"
        REPO="${BASH_REMATCH[2]}"
        BRANCH="${BASH_REMATCH[3]}"
        PATH_PREFIX="${BASH_REMATCH[5]:-}"
    else
        echo "Error: Invalid GitHub URL format"
        echo "URL must be in the format: https://github.com/user/repo/tree/branch/path"
        exit 1
    fi
    
    echo "Repository: $OWNER/$REPO"
    echo "Branch: $BRANCH"
    echo "Path: $PATH_PREFIX"
}

# Check if a path matches any of the exclude patterns
should_exclude() {
    local path="$1"
    
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        # Convert glob pattern to regex
        local regex_pattern=$(echo "$pattern" | sed 's/\*/\.*/g')
        
        # Check if the path matches the pattern
        if [[ "$path" =~ $regex_pattern ]]; then
            return 0  # True, should exclude
        fi
    done
    
    return 1  # False, should not exclude
}

# Process a file or directory recursively
process_item() {
    local path="$1"
    
    # Check if the path should be excluded
    if should_exclude "$path"; then
        echo "Excluding $path (matched exclude pattern)..." >&2
        return
    fi
    
    local api_url="https://api.github.com/repos/$OWNER/$REPO/contents/$path?ref=$BRANCH"
    
    echo "Fetching content from $path..." >&2
    
    # Make the API request
    local response=$(curl -s "$api_url")
    
    # Check if the response is an error
    if [[ "$response" == *"\"message\""* ]] && [[ "$response" == *"\"documentation_url\""* ]]; then
        echo "Error from GitHub API:" >&2
        echo "$response" | jq -r '.message' >&2
        return 1
    fi
    
    # If the response is an array, it's a directory, otherwise it's a file
    if [[ "$response" == "["* ]]; then
        # Process each item in the directory
        echo "$response" | jq -c '.[]' | while read -r item; do
            local item_type=$(echo "$item" | jq -r '.type')
            local item_path=$(echo "$item" | jq -r '.path')
            
            if [ "$item_type" == "file" ]; then
                download_file "$item_path"
            elif [ "$item_type" == "dir" ]; then
                process_item "$item_path"
            fi
        done
    fi
}

# Download a file from GitHub
download_file() {
    local path="$1"
    local filename=$(basename "$path")
    local raw_url="https://raw.githubusercontent.com/$OWNER/$REPO/$BRANCH/$path"
    
    echo "Downloading $path..." >&2
    
    # Download the file
    local content=$(curl -s "$raw_url")
    
    # Check file extension to determine if it's a text file
    local file_ext="${filename##*.}"
    
    # List of known text file extensions
    local text_extensions=("txt" "md" "mdx" "js" "jsx" "ts" "tsx" "html" "css" "scss" "sass" 
                           "json" "xml" "yaml" "yml" "sh" "bash" "py" "rb" "java" "c" "cpp" 
                           "h" "hpp" "cs" "go" "rs" "php" "pl" "swift" "kt" "config" "conf" 
                           "ini" "csv" "tsv" "sql" "graphql" "env" "gitignore" "dockerignore"
                           "vue" "jsx" "svelte" "lua" "r" "ps1" "bat" "cmd" "asm" "s" "groovy"
                           "gradle" "tf" "toml" "properties" "plist")
    
    # Check if the file extension is in our list of text extensions
    local is_text_file=false
    for ext in "${text_extensions[@]}"; do
        if [[ "$file_ext" == "$ext" ]]; then
            is_text_file=true
            break
        fi
    done
    
    # If it's not a recognized text extension, use the mime-type as a fallback
    if [[ "$is_text_file" == "false" ]]; then
        local mime_encoding=$(file --mime-encoding -b <(echo "$content"))
        if [[ "$mime_encoding" == "us-ascii" || "$mime_encoding" == "utf-8" ]]; then
            is_text_file=true
        fi
    fi
    
    # Skip if it's not a text file
    if [[ "$is_text_file" == "false" ]]; then
        echo "Skipping binary file: $path" >&2
        return
    fi
    
    # Output the file content with a header
    {
        echo "/*********************************************"
        echo " * File: $path"
        echo " *********************************************/\n"
        echo "$content"
        echo -e "\n\n"
    } >> "$TEMP_FILE"
}

# Main function
main() {
    # Check if we have the required arguments
    if [ $# -lt 1 ]; then
        show_usage
    fi
    
    # Check if required tools are installed
    check_requirements
    
    # Initialize exclude patterns array
    EXCLUDE_PATTERNS=()
    
    # Process arguments
    GITHUB_URL=""
    OUTPUT_FILE=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --exclude)
                if [[ -n "$2" && "$2" != --* ]]; then
                    # Split the comma-separated list into an array
                    IFS=',' read -ra EXCLUDE_PATTERNS <<< "$2"
                    shift 2
                else
                    echo "Error: --exclude requires a comma-separated list of patterns"
                    exit 1
                fi
                ;;
            --*)
                echo "Error: Unknown option $1"
                show_usage
                ;;
            *)
                if [[ -z "$GITHUB_URL" ]]; then
                    GITHUB_URL="$1"
                elif [[ -z "$OUTPUT_FILE" ]]; then
                    OUTPUT_FILE="$1"
                else
                    echo "Error: Too many positional arguments"
                    show_usage
                fi
                shift
                ;;
        esac
    done
    
    # Check if GitHub URL is provided
    if [[ -z "$GITHUB_URL" ]]; then
        echo "Error: GitHub URL is required"
        show_usage
    fi
    
    # Parse the GitHub URL
    parse_github_url "$GITHUB_URL"
    
    # Print exclude patterns if any
    if [[ ${#EXCLUDE_PATTERNS[@]} -gt 0 ]]; then
        echo "Excluding patterns: ${EXCLUDE_PATTERNS[*]}"
    fi
    
    # Create a temporary file
    TEMP_FILE=$(mktemp)
    
    # Add a header to the output
    {
        echo "/*********************************************"
        echo " * Repository: $OWNER/$REPO"
        echo " * Branch: $BRANCH"
        echo " * Path: $PATH_PREFIX"
        echo " * Generated: $(date)"
        echo " * Recursively concatenated all files"
        echo " *********************************************/\n\n"
    } > "$TEMP_FILE"
    
    # Recursively process all files and directories
    process_item "$PATH_PREFIX"
    
    # Output the result
    if [ -z "$OUTPUT_FILE" ]; then
        # Output to stdout
        cat "$TEMP_FILE"
    else
        # Output to file
        mv "$TEMP_FILE" "$OUTPUT_FILE"
        echo "Files have been recursively concatenated and saved to $OUTPUT_FILE"
    fi
    
    # Clean up
    if [ -f "$TEMP_FILE" ]; then
        rm "$TEMP_FILE"
    fi
}

# Run the script
main "$@"