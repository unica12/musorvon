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
