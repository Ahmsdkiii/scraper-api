import axios from 'axios';
import * as cheerio from 'cheerio';

const OTAKUDESU_BASE = process.env.OTAKUDESU_BASE_URL || 'https://otakudesu.best';
const MAL_BASE = process.env.MYANIMELIST_BASE_URL || 'https://myanimelist.net';

const configAxios = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
    'Referer': `${OTAKUDESU_BASE}/`
  },
  timeout: 15000
});

const safeSlug = (href, indexFromEnd = 1) => {
  if (!href) return '';
  const parts = href.split('/').filter(Boolean);
  return parts.length >= indexFromEnd ? parts[parts.length - indexFromEnd] : '';
};

export class OtakudesuScraper {
  static async getGenres() {
    try {
      const response = await configAxios.get(`${OTAKUDESU_BASE}/genre-list/`);
      const $ = cheerio.load(response.data);
      const data = [];
      
      $('.genres').find('li > a').each((_, element) => {
        const href = $(element).attr('href') || '';
        data.push({
          judul: $(element).text(),
          slug: href.split('/')[2]
        });
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching genres:', error.message);
      throw error;
    }
  }

  static async getAnimeList() {
    try {
      const response = await configAxios.get(`${OTAKUDESU_BASE}/anime-list/`);
      const $ = cheerio.load(response.data);
      const data = [];
      
      $('.hodebgst').each((_, a) => {
        const href = $(a).attr('href') || '';
        data.push({
          judul: $(a).text(),
          slug: safeSlug(href)
        });
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching anime list:', error.message);
      throw error;
    }
  }

  static async getAnimeCards(params) {
    try {
      const { type, genre, search, page = 1 } = params;
      
      let endpoint = '';
      if (type === 'ongoing') {
        endpoint = `${OTAKUDESU_BASE}/ongoing-anime/page/${page}/`;
      } else if (genre) {
        endpoint = `${OTAKUDESU_BASE}/genres/${genre}/page/${page}/`;
      } else if (search) {
        endpoint = `${OTAKUDESU_BASE}/?s=${search}&post_type=anime`;
      } else {
        endpoint = `${OTAKUDESU_BASE}/complete-anime/page/${page}/`;
      }

      const response = await configAxios.get(endpoint);
      const $ = cheerio.load(response.data);
      const data = [];

      const selector = genre ? '.col-md-4' : search ? '.page ul > li' : '.venz ul > li';
      
      $(genre ? '.page' : search ? '.page' : '.venz')
        .find(selector)
        .each((_, element) => {
          const imgSelector = genre ? '.col-anime-cover > img' : search ? 'img' : '.thumbz > img';
          const titleSelector = genre ? '.col-anime-title' : search ? 'h2 > a' : 'h2.jdlflm';
          const linkSelector = genre ? '.col-anime-trailer > a' : search ? 'h2 > a' : '.thumb > a';
          const epsSelector = genre ? '.col-anime-eps' : '.epz';

          const href = $(element).find(linkSelector).attr('href') || '';
          
          data.push({
            gambar: $(element).find(imgSelector).attr('src') || '',
            judul: $(element).find(titleSelector).text(),
            slug: safeSlug(href),
            eps: $(element).find(epsSelector).text().split(genre ? ' Eps' : 'Episode')
          });
        });

      return search && page > 1 ? [] : data;
    } catch (error) {
      console.error('Error fetching anime cards:', error.message);
      throw error;
    }
  }

  static async getAnimeDetail(slug) {
    try {
      const response = await configAxios.get(`${OTAKUDESU_BASE}/anime/${slug}/`);
      const $ = cheerio.load(response.data);

      const episodes = [];
      const batch = [];
      const lengkap = [];

      $('.episodelist > ul').find('li').each((_, element) => {
        const href = $(element).find('span > a').attr('href') || '';
        const linkData = {
          judul: $(element).find('span > a').text(),
          slug: safeSlug(href),
          tanggal: $(element).find('span').eq(1).text()
        };

        if (href.includes('episode')) {
          episodes.push(linkData);
        } else if (href.includes('batch')) {
          batch.push(linkData);
        } else {
          lengkap.push(linkData);
        }
      });

      return {
        gambar: $('.fotoanime').find('img').attr('src') || '',
        judul: $('.jdlrx').find('h1').text().trim(),
        nama: $('.infozingle').find('p').eq(0).text(),
        namaJapan: $('.infozingle').find('p').eq(1).text(),
        skor: $('.infozingle').find('p').eq(2).text(),
        produser: $('.infozingle').find('p').eq(3).text(),
        tipe: $('.infozingle').find('p').eq(4).text(),
        status: $('.infozingle').find('p').eq(5).text(),
        totalEpisode: $('.infozingle').find('p').eq(6).text(),
        durasi: $('.infozingle').find('p').eq(7).text(),
        rilis: $('.infozingle').find('p').eq(8).text(),
        studio: $('.infozingle').find('p').eq(9).text(),
        genre: $('.infozingle').find('p').eq(10).text(),
        episodes,
        batch,
        lengkap
      };
    } catch (error) {
      console.error('Error fetching anime detail:', error.message);
      throw error;
    }
  }

  static async getEpisodeDetail(slug) {
    try {
      const response = await configAxios.get(`${OTAKUDESU_BASE}/episode/${slug}/`);
      const $ = cheerio.load(response.data);

      const mirror = { m360p: [], m480p: [], m720p: [] };
      const download = {
        d360pmp4: [], d480pmp4: [], d720pmp4: [], d1080pmp4: [],
        d480pmkv: [], d720pmkv: [], d1080pmkv: []
      };

      ['m360p', 'm480p', 'm720p'].forEach(quality => {
        $(`.${quality}`).find('li').each((_, element) => {
          mirror[quality].push({
            nama: $(element).find('a').text(),
            content: $(element).find('a').attr('data-content') || ''
          });
        });
      });

      const downloadMapping = [
        { type: 'd360pmp4', ul: 0, li: 0 },
        { type: 'd480pmp4', ul: 0, li: 1 },
        { type: 'd720pmp4', ul: 0, li: 2 },
        { type: 'd1080pmp4', ul: 0, li: 3 },
        { type: 'd480pmkv', ul: 1, li: 0 },
        { type: 'd720pmkv', ul: 1, li: 1 },
        { type: 'd1080pmkv', ul: 1, li: 2 }
      ];

      downloadMapping.forEach(({ type, ul, li }) => {
        $('.download').find('ul').eq(ul).find('li').eq(li).find('a').each((_, element) => {
          download[type].push({
            nama: $(element).text(),
            href: $(element).attr('href') || ''
          });
        });
      });

      return {
        judul: $('.posttl').text(),
        iframe: $('.responsive-embed-stream > iframe').attr('src') || '',
        mirror,
        download
      };
    } catch (error) {
      console.error('Error fetching episode detail:', error.message);
      throw error;
    }
  }

  static async getSchedule() {
    try {
      const response = await configAxios.get(`${OTAKUDESU_BASE}/jadwal-rilis/`);
      const $ = cheerio.load(response.data);
      const data = [];

      $('.kgjdwl321').find('.kglist321').each((_, element) => {
        const scheduleDay = {
          hari: $(element).find('h2').text(),
          anime: []
        };

        $(element).find('ul > li').each((_, el) => {
          const href = $(el).find('a').attr('href') || '';
          scheduleDay.anime.push({
            judul: $(el).find('a').text(),
            slug: safeSlug(href)
          });
        });

        data.push(scheduleDay);
      });

      return data;
    } catch (error) {
      console.error('Error fetching schedule:', error.message);
      throw error;
    }
  }

  static async getNonce() {
    try {
      const response = await configAxios.post(
        `${OTAKUDESU_BASE}/wp-admin/admin-ajax.php`,
        new URLSearchParams({ action: 'aa1208d27f29ca340c92c66d1926f13f' }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching nonce:', error.message);
      throw error;
    }
  }

  static async getIframe(content, nonce) {
    try {
      const decodedContent = JSON.parse(Buffer.from(content, 'base64').toString());
      
      const response = await configAxios.post(
        `${OTAKUDESU_BASE}/wp-admin/admin-ajax.php`,
        new URLSearchParams({
          ...decodedContent,
          nonce,
          action: '2a3505c93b0035d3f455df82bf976b84'
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      return Buffer.from(response.data.data, 'base64').toString();
    } catch (error) {
      console.error('Error fetching iframe:', error.message);
      throw error;
    }
  }
}