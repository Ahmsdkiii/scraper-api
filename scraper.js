import axios from 'axios'
import cheerio from 'cheerio'

const OTAKUDESU_BASE = 'https://otakudesu.best'

const configAxios = axios.create({
  timeout: 20000,
  maxRedirects: 5,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/120.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': `${OTAKUDESU_BASE}/`,
    'Origin': OTAKUDESU_BASE,
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'Cookie': '_ga=GA1.2.123456789.123456789; _gid=GA1.2.987654321.987654321'
  }
})

const normalizeSlug = (slug) =>
  decodeURIComponent(slug || '')
    .replace(/\s+/g, '')
    .replace(/\/+$/, '')
    .trim()

const safeSlug = (href, indexFromEnd = 1) => {
  if (!href) return ''
  const parts = href.split('/').filter(Boolean)
  return parts[parts.length - indexFromEnd] || ''
}

export class OtakudesuScraper {
  static async getGenres() {
    const res = await configAxios.get(`${OTAKUDESU_BASE}/genre-list/`)
    const $ = cheerio.load(res.data)
    const data = []

    $('.genres li a').each((_, el) => {
      const href = $(el).attr('href') || ''
      data.push({
        judul: $(el).text().trim(),
        slug: safeSlug(href)
      })
    })

    return data
  }

  static async getAnimeList() {
    const res = await configAxios.get(`${OTAKUDESU_BASE}/anime-list/`)
    const $ = cheerio.load(res.data)
    const data = []

    $('.hodebgst a').each((_, el) => {
      const href = $(el).attr('href') || ''
      data.push({
        judul: $(el).text().trim(),
        slug: safeSlug(href)
      })
    })

    return data
  }

  static async getAnimeCards({ type, genre, search, page = 1 }) {
    let url = `${OTAKUDESU_BASE}/complete-anime/page/${page}/`

    if (type === 'ongoing')
      url = `${OTAKUDESU_BASE}/ongoing-anime/page/${page}/`
    else if (genre)
      url = `${OTAKUDESU_BASE}/genres/${genre}/page/${page}/`
    else if (search)
      url = `${OTAKUDESU_BASE}/?s=${encodeURIComponent(search)}&post_type=anime`

    const res = await configAxios.get(url)
    const $ = cheerio.load(res.data)
    const data = []

    $('.venz ul li').each((_, el) => {
      const href = $(el).find('.thumb a').attr('href') || ''
      data.push({
        gambar: $(el).find('.thumb img').attr('src') || '',
        judul: $(el).find('h2').text().trim(),
        slug: safeSlug(href),
        eps: $(el).find('.epz').text().trim()
      })
    })

    return data
  }

  static async getAnimeDetail(slug) {
    const cleanSlug = normalizeSlug(slug)
    const res = await configAxios.get(
      `${OTAKUDESU_BASE}/anime/${cleanSlug}/`
    )
    const $ = cheerio.load(res.data)

    const episodes = []
    const batch = []
    const lengkap = []

    $('.episodelist ul li').each((_, el) => {
      const a = $(el).find('a')
      const href = a.attr('href') || ''
      const item = {
        judul: a.text().trim(),
        slug: safeSlug(href),
        tanggal: $(el).find('span').eq(1).text().trim()
      }

      if (href.includes('episode')) episodes.push(item)
      else if (href.includes('batch')) batch.push(item)
      else lengkap.push(item)
    })

    return {
      gambar: $('.fotoanime img').attr('src') || '',
      judul: $('.jdlrx h1').text().trim(),
      info: $('.infozingle').text().trim(),
      episodes,
      batch,
      lengkap
    }
  }

  static async getEpisodeDetail(slug) {
    const res = await configAxios.get(
      `${OTAKUDESU_BASE}/episode/${normalizeSlug(slug)}/`
    )
    const $ = cheerio.load(res.data)

    return {
      judul: $('.posttl').text().trim(),
      iframe: $('.responsive-embed-stream iframe').attr('src') || ''
    }
  }

  static async getSchedule() {
    const res = await configAxios.get(`${OTAKUDESU_BASE}/jadwal-rilis/`)
    const $ = cheerio.load(res.data)
    const data = []

    $('.kgjdwl321 .kglist321').each((_, el) => {
      const hari = $(el).find('h2').text().trim()
      const anime = []

      $(el).find('li a').each((_, a) => {
        const href = $(a).attr('href') || ''
        anime.push({
          judul: $(a).text().trim(),
          slug: safeSlug(href)
        })
      })

      data.push({ hari, anime })
    })

    return data
  }
}
