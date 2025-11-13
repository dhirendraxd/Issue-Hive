#!/bin/bash

# Deploy Firebase Storage Rules
# This script deploys the storage.rules file to Firebase

echo "🚀 Deploying Firebase Storage Rules..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI is not installed"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Deploy storage rules
firebase deploy --only storage --project issue-hive 2>/dev/null || firebase deploy --only storage

if [ $? -eq 0 ]; then
    echo "✅ Storage rules deployed successfully!"
    echo ""
    echo "📝 Rules deployed:"
    echo "  - Profile pictures: /avatars/{userId}/"
    echo "  - Max file size: 5MB"
    echo "  - Allowed types: Images only"
    echo ""
    echo "🔒 Security:"
    echo "  - Users can only upload to their own directory"
    echo "  - Read access is public"
    echo "  - Write access requires authentication"
else
    echo "❌ Failed to deploy storage rules"
    echo "Make sure you're logged in with: firebase login"
    exit 1
fi
