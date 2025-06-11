import * as cheerio from "cheerio"
import { translateText } from "../utils/translate"

const trending = defineSource(async () => {
  const baseURL = "https://github.com"
  const html: any = await myFetch("https://github.com/trending?spoken_language_code=")
  const $ = cheerio.load(html)
  const $main = $("main .Box div[data-hpc] > article")
  const items: Array<{
    url: string
    title: string
    id: string
    star: string
    desc: string
  }> = []

  $main.each((_, el) => {
    const a = $(el).find(">h2 a")
    const title = a.text().replace(/\n+/g, "").trim()
    const url = a.attr("href")
    const star = $(el).find("[href$=stargazers]").text().replace(/\s+/g, "").trim()
    const desc = $(el).find(">p").text().replace(/\n+/g, "").trim()
    if (url && title) {
      items.push({
        url: `${baseURL}${url}`,
        title,
        id: url,
        star,
        desc,
      })
    }
  })

  const translatedNews = await Promise.all(
    items.map(async (item) => {
      if (!item.desc) {
        return {
          url: item.url,
          title: item.title,
          id: item.id,
          extra: {
            info: `✰ ${item.star}`,
          },
        }
      }

      // 检测是否为中文
      const isChinese = /[\u4E00-\u9FFF]/.test(item.desc)

      let titleZh = ""
      if (isChinese) {
        // 如果原文是中文，只显示中文
        titleZh = item.desc
      } else {
        // 如果原文是英文，翻译并显示两者
        const descZh = await translateText(item.desc)
        // 总是显示原文 | 翻译的格式（如果有翻译的话）
        titleZh = descZh ? `${item.desc} | ${descZh}` : item.desc
      }

      return {
        url: item.url,
        title: item.title,
        titleZh,
        id: item.id,
        extra: {
          info: `✰ ${item.star}`,
          hover: item.desc,
        },
      }
    }),
  )

  return translatedNews
})

export default defineSource({
  "github": trending,
  "github-trending-today": trending,
})
