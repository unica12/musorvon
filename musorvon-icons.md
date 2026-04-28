# Claude Code — PWA Иконка МусорВон

Generate all required PWA icons for МусорВон and wire them into the Vite PWA config.

---

## Step 1 — Create the SVG master icon

Create file `public/icon.svg` with this design:
- Background: rounded square, color #33A65A (green)
- Center: white trash can icon (простой и узнаваемый)
- Style: flat, bold, minimal — хорошо читается на маленьких размерах

Use this SVG code exactly:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Green rounded background -->
  <rect width="512" height="512" rx="115" fill="#33A65A"/>
  
  <!-- Trash can lid -->
  <rect x="156" y="164" width="200" height="24" rx="12" fill="white"/>
  <!-- Lid handle -->
  <rect x="220" y="140" width="72" height="28" rx="10" fill="white"/>
  
  <!-- Trash can body -->
  <rect x="172" y="200" width="168" height="180" rx="16" fill="white"/>
  
  <!-- Three vertical lines on body -->
  <rect x="224" y="220" width="12" height="140" rx="6" fill="#33A65A"/>
  <rect x="250" y="220" width="12" height="140" rx="6" fill="#33A65A"/>
  <rect x="276" y="220" width="12" height="140" rx="6" fill="#33A65A"/>
</svg>
```

---

## Step 2 — Generate PNG icons from SVG

Install sharp:
```bash
npm install --save-dev sharp
```

Create script `scripts/generate-icons.mjs`:

```javascript
import sharp from 'sharp'
import { readFileSync } from 'fs'
import { mkdir } from 'fs/promises'

await mkdir('public/icons', { recursive: true })

const svg = readFileSync('public/icon.svg')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`)
  console.log(`✓ icon-${size}x${size}.png`)
}

// Maskable icon — with padding (for Android adaptive icons)
await sharp(svg)
  .resize(512, 512)
  .png()
  .toFile('public/icons/icon-maskable-512x512.png')
console.log('✓ icon-maskable-512x512.png')

// Apple touch icon (180x180)
await sharp(svg)
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png')
console.log('✓ apple-touch-icon.png')

// Favicon 32x32
await sharp(svg)
  .resize(32, 32)
  .png()
  .toFile('public/favicon-32x32.png')
console.log('✓ favicon-32x32.png')

// Favicon 16x16
await sharp(svg)
  .resize(16, 16)
  .png()
  .toFile('public/favicon-16x16.png')
console.log('✓ favicon-16x16.png')

console.log('\n✅ All icons generated in public/icons/')
```

Run the script:
```bash
node scripts/generate-icons.mjs
```

---

## Step 3 — Update vite.config.ts PWA manifest

Update the VitePWA plugin config in `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon-32x32.png', 'apple-touch-icon.png', 'icon.svg'],
  manifest: {
    name: 'МусорВон',
    short_name: 'МусорВон',
    description: 'Вызов уборки мусора за одно касание',
    theme_color: '#33A65A',
    background_color: '#F7FAF6',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-cache',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24,
          },
        },
      },
    ],
  },
})
```

---

## Step 4 — Update index.html

Replace existing favicon/apple-touch-icon links in `index.html` `<head>`:

```html
<link rel="icon" type="image/svg+xml" href="/icon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#33A65A" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="МусорВон" />
```

---

## Step 5 — Add generate script to package.json

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "generate-icons": "node scripts/generate-icons.mjs"
}
```

---

## Step 6 — Verify

```bash
# Check all icons exist
ls public/icons/
ls public/apple-touch-icon.png
ls public/favicon-32x32.png

# Build and check manifest
npm run build
cat dist/manifest.webmanifest
```

The manifest should list all icons with correct paths.

After `npm run dev`, open Chrome DevTools → Application → Manifest
— should show the green МусорВон icon with all sizes listed.

On iPhone: open the app in Safari → Share → "На экран «Домой»"
— the green trash can icon should appear.
