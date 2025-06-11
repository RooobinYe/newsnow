import { translateText } from '../utils/translate'

export default defineSource(async () => {
  // WSJ使用RSS源
  const data = await rss2json("https://feeds.a.dj.com/rss/RSSWorldNews.xml")
  if (!data?.items.length) throw new Error("Cannot fetch WSJ data")
  
  // 按发布时间排序，最新的在前（热点逻辑）
  const sortedItems = data.items
    .sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime())
    .slice(0, 20)
  
  const translatedItems = await Promise.all(
    sortedItems.map(async (item, index) => {
      const titleZh = await translateText(item.title)
      const contentZh = item.content ? await translateText(item.content) : undefined
      
      // 计算发布时间的热度权重（24小时内为热点）
      const pubTime = new Date(item.created || 0).getTime()
      const now = Date.now()
      const hoursDiff = (now - pubTime) / (1000 * 60 * 60)
      const isHot = hoursDiff <= 24
      
      return {
        title: item.title,
        titleZh,
        url: item.link,
        id: item.link,
        pubDate: item.created,
        extra: {
          info: isHot ? `🔥 #${index + 1}` : `#${index + 1}`,
          hover: item.content,
          hoverZh: contentZh,
        },
      }
    })
  )
  return translatedItems
})