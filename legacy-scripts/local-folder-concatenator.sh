#!/bin/bash

# Local Folder Concatenator
# This script recursively concatenates all text files from a local directory

# ./local-folder-concatenator.sh ./src
# ./local-folder-concatenator.sh /path/to/folder output.txt
# ./local-folder-concatenator.sh ./project --exclude '*.test.js,node_modules,*.log'

# Check if required tools are installed
check_requirements() {
    local missing_tools=()
    
    for tool in file mktemp; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        echo "Error: The following required tools are missing:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        echo "Please install them using your package manager"
        exit 1
    fi
}

# Display usage information
show_usage() {
    echo "Usage: $0 <directory_path> [output_file] [--exclude pattern1,pattern2,...]"
    echo ""
    echo "Examples:"
    echo "  $0 ./src"
    echo "  $0 /path/to/folder concatenated.txt"
    echo "  $0 ./src output.txt --exclude '*.test.js,node_modules,*.log'"
    echo ""
    echo "Options:"
    echo "  --exclude   Comma-separated list of patterns to exclude (supports * wildcard)"
    echo ""
    echo "If output_file is not specified, the result will be printed to stdout."
    exit 1
}

# Check if a path matches any of the exclude patterns
should_exclude() {
    local path="$1"
    
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        # Use bash's glob matching
        if [[ "$path" == $pattern ]]; then
            return 0  # True, should exclude
        fi
    done
    
    return 1  # False, should not exclude
}

# Process a file or directory recursively
process_item() {
    local path="$1"
    local base_path="$2"
    
    # Check if the path should be excluded
    local rel_path="${path#$base_path/}"
    if should_exclude "$rel_path"; then
        echo "Excluding $rel_path (matched exclude pattern)..." >&2
        return
    fi
    
    # If it's a directory, process all files and subdirectories
    if [ -d "$path" ]; then
        # Get sorted list of files and directories
        local items=$(find "$path" -maxdepth 1 -mindepth 1 -name "[!.]*" | sort)
        
        for item in $items; do
            process_item "$item" "$base_path"
        done
    elif [ -f "$path" ]; then
        process_file "$path" "$base_path"
    fi
}

# Process a file
process_file() {
    local path="$1"
    local base_path="$2"
    local rel_path="${path#$base_path/}"
    
    # Check if the file should be excluded
    if should_exclude "$rel_path"; then
        echo "Excluding $rel_path (matched exclude pattern)..." >&2
        return
    fi
    
    echo "Processing $rel_path..." >&2
    
    # Determine if it's a text file
    local file_type=$(file -b --mime-type "$path")
    
    # Check if the file is a text file
    if [[ "$file_type" == text/* ]] || [[ "$file_type" == application/json ]] || \
       [[ "$file_type" == application/xml ]] || [[ "$file_type" == application/javascript ]]; then
        # Output the file content with a header
        {
            echo "/*********************************************"
            echo " * File: $rel_path"
            echo " *********************************************/\n"
            cat "$path"
            echo -e "\n\n"
        } >> "$TEMP_FILE"
    else
        echo "Skipping binary file: $rel_path" >&2
    fi
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
    DIRECTORY_PATH=""
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
                if [[ -z "$DIRECTORY_PATH" ]]; then
                    DIRECTORY_PATH="$1"
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
    
    # Check if directory path is provided
    if [[ -z "$DIRECTORY_PATH" ]]; then
        echo "Error: Directory path is required"
        show_usage
    fi
    
    # Check if the directory exists
    if [ ! -d "$DIRECTORY_PATH" ]; then
        echo "Error: Directory not found: $DIRECTORY_PATH"
        exit 1
    fi
    
    # Resolve absolute path
    DIRECTORY_PATH=$(cd "$DIRECTORY_PATH" && pwd)
    
    # Print exclude patterns if any
    if [[ ${#EXCLUDE_PATTERNS[@]} -gt 0 ]]; then
        echo "Excluding patterns: ${EXCLUDE_PATTERNS[*]}"
    fi
    
    # Create a temporary file
    TEMP_FILE=$(mktemp)
    
    # Add a header to the output
    {
        echo "/*********************************************"
        echo " * Directory: $DIRECTORY_PATH"
        echo " * Generated: $(date)"
        echo " * Recursively concatenated all text files"
        echo " *********************************************/\n\n"
    } > "$TEMP_FILE"
    
    # Recursively process all files and directories
    process_item "$DIRECTORY_PATH" "$DIRECTORY_PATH"
    
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