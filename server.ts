import dotenv from 'dotenv'
dotenv.config({ override: true })

import { app } from './backend/src/server.js'
import { createServer as createViteServer } from 'vite'
import express from 'express'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT && !process.env.APPLET_ID ? parseInt(process.env.PORT, 10) : 3000
const isProduction = process.env.NODE_ENV === 'production'

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      root: resolve(__dirname, 'frontend'),
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    })

    app.use(vite.middlewares)

    // SPA fallback in development: transform and serve index.html for non-API routes
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
        return next()
      }
      try {
        const indexPath = resolve(__dirname, 'frontend/index.html')
        const rawHtml = fs.readFileSync(indexPath, 'utf-8')
        const html = await vite.transformIndexHtml(req.originalUrl, rawHtml)
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
      } catch (err) {
        vite.ssrFixStacktrace(err as Error)
        next(err)
      }
    })
  } else {
    const distPath = resolve(__dirname, 'frontend/dist')
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath))
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
          return next()
        }
        res.sendFile(resolve(distPath, 'index.html'))
      })
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyPin full-stack app running on http://0.0.0.0:${PORT}`)
  })
}

startServer().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
