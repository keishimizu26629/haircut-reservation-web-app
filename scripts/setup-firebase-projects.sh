#!/bin/bash

# Firebase Projects Setup Script
# This script helps set up Firebase projects for different environments

set -e

echo "🔥 Firebase Projects Setup Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Firebase CLI is installed
check_firebase_cli() {
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed. Please install it first:"
        echo "npm install -g firebase-tools"
        exit 1
    fi
    print_status "Firebase CLI is installed"
}

# Login to Firebase
firebase_login() {
    print_step "Logging in to Firebase..."
    if ! firebase login --no-localhost; then
        print_error "Failed to login to Firebase"
        exit 1
    fi
    print_status "Successfully logged in to Firebase"
}

# Create Firebase project
create_firebase_project() {
    local project_id=$1
    local display_name=$2

    print_step "Creating Firebase project: $project_id"

    # Check if project already exists
    if firebase projects:list | grep -q "$project_id"; then
        print_warning "Project $project_id already exists"
        return 0
    fi

    # Create new project
    if firebase projects:create "$project_id" --display-name "$display_name"; then
        print_status "Successfully created project: $project_id"
    else
        print_error "Failed to create project: $project_id"
        return 1
    fi
}

# Initialize Firebase services
init_firebase_services() {
    local project_id=$1

    print_step "Initializing Firebase services for: $project_id"

    # Use the project
    firebase use "$project_id"

    # Initialize services (non-interactive)
    firebase init firestore --project "$project_id" || true
    firebase init auth --project "$project_id" || true
    firebase init storage --project "$project_id" || true
    firebase init functions --project "$project_id" || true
    firebase init hosting --project "$project_id" || true

    print_status "Initialized Firebase services for: $project_id"
}

# Generate service account key
generate_service_account() {
    local project_id=$1
    local key_file="./firebase/service-accounts/${project_id}-service-account.json"

    print_step "Generating service account key for: $project_id"

    # Create directory if it doesn't exist
    mkdir -p "./firebase/service-accounts"

    # Generate service account key
    gcloud iam service-accounts keys create "$key_file" \
        --iam-account="firebase-adminsdk@${project_id}.iam.gserviceaccount.com" \
        --project="$project_id" || true

    if [ -f "$key_file" ]; then
        print_status "Service account key generated: $key_file"
        print_warning "Remember to encode this file to Base64 for environment variables:"
        echo "base64 -i $key_file"
    else
        print_warning "Could not generate service account key automatically"
        print_warning "Please create it manually in the Firebase Console"
    fi
}

# Main setup function
main() {
    print_status "Starting Firebase projects setup..."

    # Check prerequisites
    check_firebase_cli

    # Login to Firebase
    firebase_login

    # Define projects
    declare -A projects
    projects["haircut-reservation-dev"]="Haircut Reservation Development"
    projects["haircut-reservation-staging"]="Haircut Reservation Staging"
    projects["haircut-reservation-prod"]="Haircut Reservation Production"

    # Create projects
    for project_id in "${!projects[@]}"; do
        display_name="${projects[$project_id]}"

        echo ""
        print_step "Setting up project: $project_id"

        # Create project
        create_firebase_project "$project_id" "$display_name"

        # Initialize services
        init_firebase_services "$project_id"

        # Generate service account (requires gcloud CLI)
        if command -v gcloud &> /dev/null; then
            generate_service_account "$project_id"
        else
            print_warning "gcloud CLI not found. Skipping service account generation."
            print_warning "Please generate service account keys manually in Firebase Console."
        fi

        print_status "Completed setup for: $project_id"
    done

    echo ""
    print_status "🎉 Firebase projects setup completed!"
    echo ""
    print_warning "Next steps:"
    echo "1. Copy .env.template to .env.local and fill in the Firebase configuration"
    echo "2. Generate and encode service account keys for each environment"
    echo "3. Update the environment variables in your deployment system"
    echo "4. Test the connection with: npm run test:firebase"
}

# Run main function
main "$@"
