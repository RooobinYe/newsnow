import { load } from "cheerio"
import type { NewsItem } from "@shared/types"
import { translateText } from '../utils/translate'

export default defineSource(async () => {
  const baseURL = "https://www.foxnews.com"
  const html: any = await myFetch(baseURL)
  const $ = load(html)
  const news: NewsItem[] = []
  
  // 获取主要新闻文章
  const selectors = [
    ".story-headline a",
    ".article-title a", 
    ".title a",
    "h1 a",
    "h2 a",
    "h3 a[href*='foxnews.com']"
  ]
  
  for (const selector of selectors) {
    $(selector).each((index, el) => {
      const $el = $(el)
      const title = $el.text().trim()
      const url = $el.attr("href")
      
      if (title && url && title.length > 10) {
        const fullUrl = url.startsWith("http") ? url : `${baseURL}${url}`
        
        // 避免重复文章
        const isDuplicate = news.some(item => 
          item.title === title || item.url === fullUrl
        )
        
        if (!isDuplicate && news.length < 20) {
          // 寻找相关的描述信息
          const $parent = $el.closest('article, .story, .content')
          const description = $parent.find('p, .description, .summary').first().text().trim()
          
          news.push({
            title,
            url: fullUrl,
            id: url,
            extra: {
              hover: description || title
            }
          })
        }
      }
    })
    
    if (news.length >= 20) break
  }
  
  // 添加翻译支持，和NYT保持一致
  const translatedResults = await Promise.all(
    news.slice(0, 20).map(async (article, index) => {
      const titleZh = await translateText(article.title)
      const hoverZh = article.extra?.hover ? await translateText(article.extra.hover) : undefined
      
      return {
        id: article.id,
        title: article.title,
        titleZh,
        url: article.url,
        extra: {
          info: `#${index + 1}`,
          hover: article.extra?.hover,
          hoverZh,
        },
      }
    })
  )
  
  return translatedResults
})