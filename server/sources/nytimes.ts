import { translateText } from '../utils/translate'

interface NYTMostPopularRes {
  status: string
  num_results: number
  results: {
    url: string
    title: string
    abstract: string
    byline: string
    published_date: string
    section: string
  }[]
}

export default defineSource(async () => {
  const apiKey = process.env.NYT_API_KEY
  if (!apiKey) {
    // 降级到RSS源
    const data = await rss2json("https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml")
    if (!data?.items.length) throw new Error("Cannot fetch NYT data")
    const items = data.items.slice(0, 20)
    const translatedItems = await Promise.all(
      items.map(async (item, index) => {
        const titleZh = await translateText(item.title)
        return {
          title: item.title,
          titleZh,
          url: item.link,
          id: item.link,
          pubDate: item.created,
          extra: {
            info: `#${index + 1}`,
          },
        }
      })
    )
    return translatedItems
  }
  
  const url = `https://api.nytimes.com/svc/mostpopular/v2/viewed/1.json?api-key=${apiKey}`
  const res: NYTMostPopularRes = await myFetch(url)
  
  const translatedResults = await Promise.all(
    res.results.map(async (article, index) => {
      const titleZh = await translateText(article.title)
      const abstractZh = await translateText(article.abstract)
      return {
        id: article.url,
        title: article.title,
        titleZh,
        url: article.url,
        extra: {
          info: `#${index + 1} ${article.section}`,
          hover: article.abstract,
          hoverZh: abstractZh,
        },
      }
    })
  )
  return translatedResults
})