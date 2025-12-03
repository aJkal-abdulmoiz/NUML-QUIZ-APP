import { Question, QuizCategory } from '@/types'

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_HERE'
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

export async function generateQuestions(
  category: QuizCategory,
  count: number = 5
): Promise<Omit<Question, 'id'>[]> {
  
  const prompt = `Generate ${count} multiple-choice questions for the category: ${category}.

Requirements:
- Each question should be clear and educational
- Provide exactly 4 options for each question
- Indicate the correct answer index (0-3)
- Format the response as a valid JSON array

Return ONLY a JSON array in this exact format (no markdown, no code blocks):
[
  {
    "text": "Question text here?",
    "category": "${category}",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswerIndex": 0
  }
]`

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    const text = data.candidates[0].content.parts[0].text
    
    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim()
    cleanedText = cleanedText.replace(/```\n?/g, '')
    cleanedText = cleanedText.trim()

    const questions: Omit<Question, 'id'>[] = JSON.parse(cleanedText)
    
    return questions.map(q => ({
      text: q.text,
      category: category,
      options: q.options,
      correctAnswerIndex: q.correctAnswerIndex
    }))
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw new Error('Failed to generate questions. Please check your API key and try again.')
  }
}
