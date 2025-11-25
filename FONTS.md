# Local Fonts Setup Guide

This project uses locally hosted fonts for better privacy, performance, and GDPR compliance.

## Current Font: Instrument Sans

We use **Instrument Sans** in three weights: 400 (regular), 500 (medium), and 600 (semi-bold).

## How to Download Fonts

### Option 1: Google Webfonts Helper (Recommended)

1. Visit [Google Webfonts Helper](https://gwfh.mranftl.com/fonts)
2. Search for "Instrument Sans"
3. Select the following options:
   - **Charsets**: Select `latin` only (unless you need other character sets)
   - **Styles**: Check these weights:
     - ☑ regular (400)
     - ☑ 500
     - ☑ 600
4. **Customize folder prefix**: Leave as default or set to `/fonts/instrument-sans/`
5. Scroll down to **Copy CSS** section and verify the @font-face declarations match our `resources/css/fonts.css`
6. Download the font files (click the blue **Download files** button)
7. Extract the downloaded ZIP file
8. Copy the `.woff2` files to: `public/fonts/instrument-sans/`

### Required Files

You need these 3 files in `public/fonts/instrument-sans/`:

```
public/fonts/instrument-sans/
├── instrument-sans-v1-latin-regular.woff2  (weight: 400)
├── instrument-sans-v1-latin-500.woff2      (weight: 500)
└── instrument-sans-v1-latin-600.woff2      (weight: 600)
```

### Option 2: Manual Download from Google Fonts

1. Visit [Google Fonts - Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans)
2. Click "Download family"
3. Extract the ZIP file
4. Convert TTF files to WOFF2 using a tool like:
   - [CloudConvert](https://cloudconvert.com/ttf-to-woff2)
   - [Font Squirrel Webfont Generator](https://www.fontsquirrel.com/tools/webfont-generator)
5. Rename the files to match the naming convention above
6. Place them in `public/fonts/instrument-sans/`

## Verification

After downloading and placing the font files:

1. Run `npm run build` to rebuild assets
2. Open your browser's DevTools (F12)
3. Go to the Network tab
4. Filter by "Font" or "woff2"
5. Refresh the page
6. You should see the fonts loading from `/fonts/instrument-sans/` (local) instead of external CDN

## Benefits of Local Fonts

✅ **Privacy**: No external requests to Google or other CDNs
✅ **Performance**: Faster load times with no DNS lookups
✅ **Reliability**: No dependency on third-party services
✅ **GDPR Compliant**: No user data sent to external services
✅ **Offline Support**: Fonts work even without internet connection

## File Structure

```
toll-collection-system/
├── public/
│   └── fonts/
│       └── instrument-sans/
│           ├── instrument-sans-v1-latin-regular.woff2
│           ├── instrument-sans-v1-latin-500.woff2
│           └── instrument-sans-v1-latin-600.woff2
├── resources/
│   └── css/
│       ├── app.css (imports fonts.css)
│       └── fonts.css (@font-face declarations)
└── resources/
    └── views/
        └── app.blade.php (removed external font links)
```

## Troubleshooting

**Fonts not loading?**
- Check that the font files exist in `public/fonts/instrument-sans/`
- Verify file names match exactly (case-sensitive)
- Clear browser cache and rebuild: `npm run build`
- Check browser DevTools Console for 404 errors

**Want to add more fonts?**
1. Download additional weights/styles from Google Webfonts Helper
2. Add corresponding `@font-face` declarations in `resources/css/fonts.css`
3. Place font files in `public/fonts/instrument-sans/`
4. Rebuild: `npm run build`
