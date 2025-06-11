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
    throw new Error("NYT_API_KEY is required")
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