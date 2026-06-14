/**
 * Generate a SHA-256 hash of an ArrayBuffer.
 * Returns a lowercase hex string.
 */
export async function sha256(arrayBuffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}