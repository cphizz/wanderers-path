export async function loadImageContainers(path: string): Promise<{top: number[], bottom: number[]}> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Draw full 200x200 image
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 200, 200)
      ctx.drawImage(img, 0, 0, 200, 200)

      // Split into top half (200x100) and bottom half (200x100)
      const topData = ctx.getImageData(0, 0, 200, 100).data
      const bottomData = ctx.getImageData(0, 100, 200, 100).data

      resolve({
        top: convertToG2Format(topData),
        bottom: convertToG2Format(bottomData)
      })
    }
    img.onerror = () => {
      resolve({
        top: new Array(200 * 100).fill(0),
        bottom: new Array(200 * 100).fill(0)
      })
    }
    img.src = path
  })
}

function convertToG2Format(data: Uint8ClampedArray): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    // Convert to 4-bit greyscale (0-15)
    const grey = Math.round((r * 0.299 + g * 0.587 + b * 0.114) / 255 * 15)
    result.push(Math.max(0, Math.min(15, grey)))
  }
  return result
}