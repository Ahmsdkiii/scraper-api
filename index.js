import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { OtakudesuScraper } from './scraper.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Anime Scraper API is running',
    version: '1.0.0'
  })
})

// API Routes
app.get('/api/anime', async (req, res) => {
  try {
    const data = await OtakudesuScraper.getAnimeCards(req.query)
    res.json(data)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch anime list',
      message: error.message
    })
  }
})

app.get('/api/anime/:slug', async (req, res) => {
  try {
    const data = await OtakudesuScraper.getAnimeDetail(req.params.slug)
    res.json(data)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch anime detail',
      message: error.message
    })
  }
})

app.get('/api/anime-list', async (req, res) => {
  try {
    const data = await OtakudesuScraper.getAnimeList()
    res.json(data)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch complete anime list',
      message: error.message
    })
  }
})

app.get('/api/episode/:slug', async (req, res) => {
  try {
    const data = await OtakudesuScraper.getEpisodeDetail(req.params.slug)
    res.json(data)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch episode detail',
      message: error.message
    })
  }
})

app.get('/api/genre', async (req, res) => {
  try {
    const data = await OtakudesuScraper.getGenres()
    res.json(data)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch genres',
      message: error.message
    })
  }
})

app.get('/api/jadwal', async (req, res) => {
  try {
    const data = await OtakudesuScraper.getSchedule()
    res.json(data)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch schedule',
      message: error.message
    })
  }
})

app.get('/api/nonce', async (req, res) => {
  try {
    const data = await OtakudesuScraper.getNonce()
    res.json({ data })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch nonce',
      message: error.message
    })
  }
})

app.get('/api/getIframe', async (req, res) => {
  try {
    const { content, nonce } = req.query
    const data = await OtakudesuScraper.getIframe(content, nonce)
    res.json(data)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch iframe',
      message: error.message
    })
  }
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// 🚀 IMPORTANT FOR RAILWAY
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Scraper API running on port ${PORT}`)
})
