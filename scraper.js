import axios from 'axios'
import * as cheerio from 'cheerio'

const OTAKUDESU_BASE = 'https://otakudesu.best'

const axiosClient = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':
      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8',
    'Referer': 'https://otakudesu.best/',
    'Origin': 'https://otakudesu.best'
  }
})

const cleanSlug = (slug = '') =>
  decodeURIComponent(slug).replace(/\s+/g, '').replace(/\/+$/, '')

const safeSlug = (href = '') => {
  const parts = href.split('/').filter(Boolean)
  return parts[parts.length - 1] || ''
}

export class OtakudesuScraper {
  static async getAnimeCards({ page = 1 } = {}) {
    const res = await axiosClient.get(
      `${OTAKUDESU_BASE}/complete-anime/page/${page}/`
    )

    const $ = cheerio.load(res.data)
    const data = []

    $('.venz ul li').each((_, el) => {
      const href = $(el).find('.thumb a').attr('href')
      data.push({
        judul: $(el).find('h2').text().trim(),
        gambar: $(el).find('.thumb img').attr('src'),
        slug: safeSlug(href),
        eps: $(el).find('.epz').text().trim()
      })
    })

    return data
  }

  static async getAnimeDetail(slug) {
    const res = await axiosClient.get(
      `${OTAKUDESU_BASE}/anime/${cleanSlug(slug)}/`
    )

    const $ = cheerio.load(res.data)
    const episodes = []

    $('.episodelist ul li').each((_, el) => {
      const a = $(el).find('a')
      const href = a.attr('href')

      episodes.push({
        judul: a.text().trim(),
        slug: safeSlug(href),
        tanggal: $(el).find('span').eq(1).text().trim()
      })
    })

    return {
      judul: $('.jdlrx h1').text().trim(),
      gambar: $('.fotoanime img').attr('src'),
      episodes
    }
  }

  static async getSchedule() {
    const res = await axiosClient.get(
      `${OTAKUDESU_BASE}/jadwal-rilis/`
    )

    const $ = cheerio.load(res.data)
    const data = []

    $('.kgjdwl321 .kglist321').each((_, el) => {
      const hari = $(el).find('h2').text().trim()
      const anime = []

      $(el)
        .find('li a')
        .each((_, a) => {
          anime.push({
            judul: $(a).text().trim(),
            slug: safeSlug($(a).attr('href'))
          })
        })

      data.push({ hari, anime })
    })

    return data
  }
}
