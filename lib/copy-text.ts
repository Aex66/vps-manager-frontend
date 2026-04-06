/** Copy helper for secrets (password inputs are not selectable in most browsers). */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  const v = text.trim()
  if (!v) return false
  try {
    await navigator.clipboard.writeText(v)
    return true
  } catch {
    return false
  }
}
