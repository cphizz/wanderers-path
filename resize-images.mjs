import sharp from 'sharp'
import { readdir } from 'fs/promises'
import { join } from 'path'

const files = ['title', 'village', 'cave', 'slime', 'victory']

for (const name of files) {
  const input = join('public', `${name}.png`)
  const output = join('public', `${name}.png`)
  
  await sharp(input)
    .resize(200, 200, { fit: 'fill' })
    .png()
    .toFile(output + '.tmp')
  
  // Replace original with resized
  const fs = await import('fs/promises')
  await fs.rename(output + '.tmp', output)
  
  console.log(`Resized ${name}.png to 200x200`)
}

console.log('All done!')
