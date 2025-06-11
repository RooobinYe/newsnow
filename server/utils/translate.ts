interface OpenAITranslateRes {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function translateText(text: string, from = 'English', to = 'Chinese'): Promise<string> {
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
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following ${from} text to ${to}. Only return the translated text, no explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    })

    const data: OpenAITranslateRes = await response.json()
    
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim()
    }
    
    return text
  } catch (error) {
    console.error('Translation error:', error)
    return text
  }
}