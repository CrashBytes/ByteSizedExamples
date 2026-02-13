# My App Assets

Place My App-branded image files in this directory:

## Required Files

### icon.png
- **Size**: 1024x1024px
- **Format**: PNG with transparency
- **Brand**: My App logo
- **Purpose**: App icon for iOS and Android

### splash.png
- **Size**: 1242x2436px (iPhone X resolution)
- **Format**: PNG
- **Brand**: My App splash screen
- **Purpose**: Launch screen shown while app loads

### adaptive-icon.png
- **Size**: 1024x1024px
- **Format**: PNG with transparency
- **Brand**: My App logo for Android
- **Purpose**: Android adaptive icon foreground
- **Note**: Keep important elements in center 66% circle

### favicon.png
- **Size**: 48x48px
- **Format**: PNG
- **Brand**: Simplified My App icon
- **Purpose**: Web favicon

## Testing

Run with My App config:
```bash
CLIENT=myapp npm start
```

## Validation

Validate configuration and assets:
```bash
npm run validate myapp
```

## Asset Checklist

- [ ] icon.png created (1024x1024px)
- [ ] splash.png created (1242x2436px)
- [ ] adaptive-icon.png created (1024x1024px)
- [ ] favicon.png created (48x48px)
- [ ] All assets optimized (compressed)
- [ ] Tested on iOS simulator
- [ ] Tested on Android emulator
- [ ] Tested on web browser
- [ ] Validated with npm run validate myapp

## Asset Optimization Tips

- Use [TinyPNG](https://tinypng.com) to compress PNG files
- Test on multiple device sizes
- Ensure icons look good at small sizes (60px)
- Verify splash screen on different screen ratios
- Keep file sizes reasonable (icon < 500KB, splash < 1MB)
