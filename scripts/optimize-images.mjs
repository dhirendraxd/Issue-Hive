import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const publicDir = path.join(root, 'public')
const srcPng = path.join(publicDir, 'og-image.png')
const dstWebp = path.join(publicDir, 'og-image.webp')

;(async () => {
  try {
    if (!fs.existsSync(srcPng)) {
      console.log('[assets] public/og-image.png not found, skipping WebP generation')
      process.exit(0)
    }

    let needsBuild = true
    if (fs.existsSync(dstWebp)) {
      const pngStat = fs.statSync(srcPng)
      const webpStat = fs.statSync(dstWebp)
      if (webpStat.mtimeMs >= pngStat.mtimeMs) {
        needsBuild = false
      }
    }

    if (!needsBuild) {
      console.log('[assets] public/og-image.webp is up to date')
      process.exit(0)
    }

    await sharp(srcPng).webp({ quality: 82 }).toFile(dstWebp)
    console.log('[assets] Created public/og-image.webp')
  } catch (err) {
    console.error('[assets] Failed to create og-image.webp:', err?.message || err)
    // Do not fail the build if optimization fails
    process.exit(0)
  }
})()
