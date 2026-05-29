// Run: node scripts/generate-icons.mjs
// This script generates PWA icons using Canvas API
// Install: npm install canvas
// Or use an online tool like https://maskable.app/ to generate icons from a logo

import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = '#0a0a0a'
  ctx.fillRect(0, 0, size, size)

  // Rounded square clip
  const radius = size * 0.22
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(size - radius, 0)
  ctx.quadraticCurveTo(size, 0, size, radius)
  ctx.lineTo(size, size - radius)
  ctx.quadraticCurveTo(size, size, size - radius, size)
  ctx.lineTo(radius, size)
  ctx.quadraticCurveTo(0, size, 0, size - radius)
  ctx.lineTo(0, radius)
  ctx.quadraticCurveTo(0, 0, radius, 0)
  ctx.closePath()
  ctx.clip()

  // Yellow background
  ctx.fillStyle = '#e8ff47'
  ctx.fillRect(0, 0, size, size)

  // Dumbbell icon (simplified)
  const pad = size * 0.2
  const barY = size / 2
  const barH = size * 0.08
  const weightW = size * 0.12
  const weightH = size * 0.45

  ctx.fillStyle = '#0a0a0a'

  // Left weight
  ctx.fillRect(pad, barY - weightH / 2, weightW, weightH)
  // Right weight
  ctx.fillRect(size - pad - weightW, barY - weightH / 2, weightW, weightH)
  // Bar
  ctx.fillRect(pad + weightW, barY - barH / 2, size - 2 * (pad + weightW), barH)

  const buffer = canvas.toBuffer('image/png')
  const outPath = join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.png`)
  writeFileSync(outPath, buffer)
  console.log(`Generated: ${outPath}`)
}
