interface OpenAITranslateRes {
  choices: {
    message: {
      content: string
    }
  }[]
}

const translationCache = new Map<string, string>()

function getCacheKey(text: string, from: string, to: string): string {
  return `${from}-${to}-${text}`
}

export async function translateText(text: string, from = 'English', to = 'Chinese'): Promise<string> {
  const cacheKey = getCacheKey(text, from, to)
  
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }
  
  const apiKey = process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    return text // 如果没有配置翻译API，返回原文
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'o4-mini',
        messages: [
          {
            role: 'developer',
            content: `You are a professional, authentic machine translation engine. Translate the following ${from} text into ${to}. Output translation ONLY. If translation is unnecessary (e.g. proper nouns, codes, etc.), return the original text. NO explanations. NO notes.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_completion_tokens: 1000,
        reasoning_effort: 'low'
      })
    })

    const data: OpenAITranslateRes = await response.json()
    
    if (data.choices && data.choices.length > 0) {
      const translatedText = data.choices[0].message.content.trim()
      translationCache.set(cacheKey, translatedText)
      return translatedText
    }
    
    return text
  } catch (error) {
    console.error('Translation error:', error)
    return text
  }
}