// src/lib/cloudinary.js

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME   // dtsk51yo2
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET // shortlet_ph_uploads

/**
 * Upload a single File object to Cloudinary.
 * Returns the secure_url string.
 *
 * Requirements in Cloudinary Dashboard:
 *   Settings → Upload → Upload presets → Add preset
 *   Name: shortlet_ph_uploads | Signing Mode: Unsigned | Folder: shortlet-ph
 */
export async function uploadToCloudinary(file, folder = 'properties') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', `shortlet-ph/${folder}`)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }

  const data = await res.json()
  return data.secure_url
}

/**
 * Upload multiple files. Returns array of secure URLs.
 */
export async function uploadMultiple(files, folder = 'properties', onProgress) {
  const urls = []
  for (let i = 0; i < files.length; i++) {
    const url = await uploadToCloudinary(files[i], folder)
    urls.push(url)
    if (onProgress) onProgress(i + 1, files.length)
  }
  return urls
}

/**
 * Get a Cloudinary URL with transformations applied.
 * Works for both Cloudinary URLs and plain URLs.
 */
export function cloudinaryTransform(url, opts = {}) {
  if (!url || !url.includes('cloudinary.com')) return url
  const { width = 800, height = 600, crop = 'fill', quality = 'auto' } = opts
  return url.replace(
    '/upload/',
    `/upload/w_${width},h_${height},c_${crop},q_${quality},f_auto/`
  )
}
