import { defineConfig } from 'vite'
import os from 'os'

function getLocalIP(): string {
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  plugins: [
    {
      name: 'show-qr',
      configureServer(server) {
        server.httpServer?.once('listening', async () => {
          const ip = getLocalIP()
          const url = `http://${ip}:5173`
          const qrcode = await import('qrcode-terminal')
          console.log('\n  Scan this QR code in the Even app:\n')
          qrcode.default.generate(url, { small: true })
          console.log(`\n  URL: ${url}\n`)
        })
      }
    }
  ]
})
