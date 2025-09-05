#!/bin/bash

echo "🔧 Fixing crop functionality..."

# Remove old package and install correct one
echo "📦 Installing correct image editor package..."
npm uninstall react-native-image-editor
npm install @react-native-community/image-editor@^4.2.0

# For iOS, we need to run pod install
if [ -d "ios" ]; then
    echo "🍎 Installing iOS pods..."
    cd ios && pod install && cd ..
fi

echo "✅ Crop fix complete! Please rebuild your app:"
echo "   For iOS: npx react-native run-ios"
echo "   For Android: npx react-native run-android"