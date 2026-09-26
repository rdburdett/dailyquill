# Daily Quote Chrome Extension

A simple Chrome extension that displays daily inspirational quotes from ZenQuotes API.

## Features

# Daily Quote Chrome Extension

A minimalist Chrome extension that displays daily inspirational quotes in a literature-inspired, contemplative design.

## Features

- 🌟 **New Tab Experience** - Beautiful full-screen quotes replace your new tab page
- ⚙️ **Customizable Themes** - Choose from Classic, Sepia, Sage, or Rose color palettes
- 🌓 **System-Aware Design** - Automatically adapts to light/dark mode
- 📖 **Literature-Inspired** - Elegant Cormorant Garamond typography
- 🎨 **Paper-like Textures** - Subtle visual textures for enhanced reading
- 🔄 **Daily Refresh** - New quotes with each session
- 📚 **Quote Sources** - Mix ZenQuotes with the Bible, Qur'an, Bhagavad Gita, Dhammapada, Tao Te Ching, the Stoics and Confucius's Analects
- ⚡ **Fast and Lightweight** - Optimized performance
- 🧘 **Minimalist Focus** - No clocks, dates, or distractions
- ··· **Discrete Settings** - Access theme options via minimal ellipsis button

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Build the extension:
```bash
npm run build:extension
```

3. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

### Web Preview

The new tab page also runs as a regular website: settings are saved to `localStorage` instead of Chrome storage, and ZenQuotes is reached through a same-origin proxy (`vite.config.ts` in dev, `vercel.json` on Vercel). The repo is set up for Vercel, so every push gets a preview URL.

### Development Mode

```bash
npm run dev
```

This will start the Vite development server for testing the popup UI.

### Building for Production

```bash
npm run build:extension
```

This creates an optimized build in the `dist` folder ready for Chrome.

### Publishing to the Chrome Web Store

Releases are published through GitHub Actions or `npm run publish:store`. See [PUBLISHING.md](PUBLISHING.md) for how to publish and the one-time credentials setup.

## API Sources

- **ZenQuotes**: Primary source for daily quotes
- **Fallback**: Built-in quotes for offline usage

## Design Philosophy

This extension embraces a **literature-inspired, contemplative design** that:

- **Respects your system preferences** - Automatically switches between light and dark modes
- **Minimizes distractions** - No clocks, dates, or unnecessary UI elements
- **Creates a reading atmosphere** - Paper-like textures and elegant typography
- **Focuses on content** - The quote is the star, everything else fades into the background

### Color Schemes

- **Classic**: Paper-like whites (#fdfdf8 to #f5f5f0) with warm undertones / Deep charcoal grays (#0f0f0f to #1a1a1a)
- **Sepia**: Warm, vintage book tones for a classic literature feel
- **Sage**: Soft, muted greens inspired by natural contemplation
- **Rose**: Gentle, desaturated pinks for a warming touch

Each theme automatically adapts to your system's light/dark mode preference while maintaining the literature-inspired aesthetic.

## Future Enhancements

- [ ] Quote categories/themes
- [ ] Favorite quotes
- [ ] Quote sharing
- [ ] Custom quote sources
- [ ] Daily notifications
- [ ] Quote history
- [ ] Quote of the day scheduling

## Tech Stack

- ⚛️ React 18
- 🏗️ TypeScript
- ⚡ Vite
- 🎨 CSS3 with modern features
- 🔧 Chrome Extension Manifest V3

## License

MIT License
