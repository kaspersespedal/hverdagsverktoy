# Hverdagsverktøy — Native App (Capacitor)

Native Android/iOS wrapper for the Hverdagsverktøy financial calculator PWA.

## Prerequisites

- **Node.js** (v18+)
- **Android Studio** (for Android builds)
- **Xcode** (for iOS builds, macOS only)

## Setup

```bash
cd app

# Install dependencies
npm install

# Copy web files into www/
npm run build
```

## Add Platforms

Run these once, after initial setup:

```bash
# Android
npx cap add android

# iOS (macOS only)
npx cap add ios
```

## Development Workflow

After making changes to the web app (finanskalkulator.html etc.):

```bash
# Rebuild www/ and sync to native projects
npm run build
npx cap sync
```

## Open in IDE

```bash
# Android Studio
npm run android

# Xcode
npm run ios
```

## Build APK (Android)

1. `npm run android` to open Android Studio
2. Build > Generate Signed Bundle / APK
3. Follow the signing wizard

## App Details

- **App ID:** `com.hverdagsverktoy.app`
- **App Name:** Hverdagsverktøy
- **Author:** Kasper Espedal
- **Website:** https://hverdagsverktoy.com

## How It Works

The build script (`build.js`) copies the web files from the parent directory into `www/`. Capacitor then packages these into a native WebView app. The main HTML file is copied as both `index.html` (Capacitor's expected entry point) and `finanskalkulator.html` (for manifest compatibility).
