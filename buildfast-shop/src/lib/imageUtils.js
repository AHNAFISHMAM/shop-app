import { supabase } from './supabase'
import { logger } from '../utils/logger'

/**
 * Image Upload & Management Utilities for Star Café Menu System
 * Provides simple, straightforward image handling for admin
 */

// =====================================================
// IMAGE VALIDATION
// =====================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

async function generateFileHash(file) {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch (error) {
    logger.error('Failed to hash file:', error)
    return null
  }
}

async function storeImageMetadata(hash, payload) {
  const { error } = await supabase.from('image_metadata').upsert(
    {
      hash,
      url: payload.url,
      stored_at: payload.storedAt,
      metadata: payload,
    },
    { onConflict: 'hash' }
  )

  if (error) {
    throw error
  }
}

export function validateImage(file) {
  const errors = []

  if (!file) {
    errors.push('No file selected')
    return { valid: false, errors }
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    errors.push('Invalid file type. Allowed: JPG, PNG, WEBP, GIF')
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// =====================================================
// IMAGE UPLOAD TO SUPABASE STORAGE
// =====================================================

export async function uploadMenuImage(file, dishName, metadata = {}) {
  try {
    // Validate first
    const validation = validateImage(file)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    // Generate deterministic hash-based filename to block duplicates
    const hash = await generateFileHash(file)
    if (!hash) {
      throw new Error('Failed to fingerprint image')
    }

    const fileExt = file.name.split('.').pop()
    const sanitizedName = dishName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    const baseFileName = `${hash}-${sanitizedName || 'image'}`
    const fileName = `${baseFileName}.${fileExt}`
    const filePath = `menu/${fileName}`

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('product-images') // Using existing bucket
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      const errorSnapshot = [error.statusCode, error.status, error.name, error.message]
        .filter(Boolean)
        .map(value => String(value).toLowerCase())

      const isConflict = errorSnapshot.some(
        value =>
          value.includes('409') ||
          value.includes('conflict') ||
          value.includes('already exists') ||
          value.includes('duplicate')
      )

      if (!isConflict) {
        throw error
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('product-images').getPublicUrl(filePath)

      const metadataPayload = {
        ...metadata,
        dishName,
        originalFileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        hash,
        duplicate: true,
        url: publicUrl,
        storedAt: filePath,
        uploadedAt: new Date().toISOString(),
      }

      await storeImageMetadata(hash, metadataPayload)

      return {
        success: true,
        url: publicUrl,
        path: filePath,
        duplicate: true,
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(filePath)

    const metadataPayload = {
      ...metadata,
      dishName,
      originalFileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hash,
      duplicate: false,
      url: publicUrl,
      storedAt: filePath,
      uploadedAt: new Date().toISOString(),
    }

    await storeImageMetadata(hash, metadataPayload)

    return {
      success: true,
      url: publicUrl,
      path: filePath,
      duplicate: false,
    }
  } catch (error) {
    logger.error('Image upload error:', error)
    return {
      success: false,
      error: error.message || 'Failed to upload image',
    }
  }
}

// =====================================================
// BULK IMAGE UPLOAD
// =====================================================

export async function uploadMultipleImages(files) {
  const results = []

  for (const file of files) {
    const baseName = file.name.replace(/\.[^/.]+$/, '')
    const autoMetadata = {
      title: baseName,
      altText: baseName,
      keywords: baseName.split(/[\s_-]+/).filter(Boolean),
      campaign: null,
      usageRights: null,
    }

    const result = await uploadMenuImage(file, file.name, autoMetadata)
    results.push({
      fileName: file.name,
      duplicate: Boolean(result.duplicate),
      ...result,
    })
  }

  return results
}

// =====================================================
// DELETE IMAGE FROM STORAGE
// =====================================================

export async function deleteMenuImage(imagePath) {
  try {
    // Extract path from URL if full URL provided
    let path = imagePath
    if (imagePath.includes('supabase')) {
      const urlParts = imagePath.split('/')
      const menuIndex = urlParts.findIndex(part => part === 'menu')
      if (menuIndex !== -1) {
        path = `menu/${urlParts.slice(menuIndex + 1).join('/')}`
      }
    }

    const { error } = await supabase.storage.from('product-images').remove([path])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    logger.error('Image delete error:', error)
    return {
      success: false,
      error: error.message || 'Failed to delete image',
    }
  }
}

// =====================================================
// GENERATE PLACEHOLDER IMAGE DATA URL
// =====================================================

export function generatePlaceholderImage(dishName, color = '#C59D5F') {
  try {
    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Could not create canvas context')
    }

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 400, 300)
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, adjustBrightness(color, -20))
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 400, 300)

    // Text
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Wrap text if too long
    const maxWidth = 350
    const words = dishName.split(' ')
    let line = ''
    let y = 150

    for (let word of words) {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)

      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, 200, y)
        line = word + ' '
        y += 30
      } else {
        line = testLine
      }
    }
    ctx.fillText(line, 200, y)

    // Add subtle icon (fork & knife)
    ctx.font = '48px Arial'
    ctx.fillText('🍽️', 200, 100)

    return canvas.toDataURL('image/png')
  } catch (error) {
    logger.error('Error generating placeholder:', error)
    // Return fallback placeholder URL
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'
  }
}

// Helper: Adjust color brightness
function adjustBrightness(color, percent) {
  try {
    // Validate color format
    if (!color || typeof color !== 'string' || !color.match(/^#[0-9A-F]{6}$/i)) {
      return '#C59D5F' // Return default gold color
    }

    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = ((num >> 8) & 0x00ff) + amt
    const B = (num & 0x0000ff) + amt

    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    )
  } catch (error) {
    logger.error('Error adjusting brightness:', error)
    return color // Return original color on error
  }
}

// =====================================================
// AUTO-MATCH IMAGES TO MENU ITEMS BY FILENAME
// =====================================================

export function autoMatchImages(uploadedFiles, menuItems) {
  const matches = []
  const unmatched = []

  uploadedFiles.forEach(file => {
    const fileName = file.fileName
      .toLowerCase()
      .replace(/\.(jpg|jpeg|png|webp|gif)$/i, '')
      .replace(/[_-]/g, ' ')
      .trim()

    // Try to find matching menu item
    const matchedItem = menuItems.find(item => {
      const itemName = item.name.toLowerCase().trim()
      const itemSlug = itemName.replace(/\s+/g, '-')
      const fileSlug = fileName.replace(/\s+/g, '-')

      return (
        itemName === fileName ||
        itemSlug === fileSlug ||
        itemName.includes(fileName) ||
        fileName.includes(itemName)
      )
    })

    if (matchedItem) {
      matches.push({
        file,
        menuItem: matchedItem,
        confidence: 'high',
      })
    } else {
      unmatched.push(file)
    }
  })

  return { matches, unmatched }
}

// =====================================================
// GET IMAGE URL (HANDLES VARIOUS FORMATS)
// =====================================================

export function getImageUrl(imageUrl) {
  if (!imageUrl) return null

  try {
    // If already a full URL, return as-is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl
    }

    // If relative path, assume it's in public folder
    if (imageUrl.startsWith('/')) {
      return imageUrl
    }

    // Otherwise, assume it's a Supabase storage path
    const {
      data: { publicUrl },
    } = supabase.storage.from('product-images').getPublicUrl(imageUrl)

    return publicUrl
  } catch (error) {
    logger.error('Error getting image URL:', error)
    return imageUrl // Return original URL on error
  }
}

// =====================================================
// CHECK IF IMAGE EXISTS (VALIDATE URL)
// =====================================================

export async function checkImageExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

// =====================================================
// COMPRESS IMAGE (CLIENT-SIDE)
// =====================================================

export async function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = e => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            resolve(
              new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
            )
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = reject
      img.src = e.target.result
    }

    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
