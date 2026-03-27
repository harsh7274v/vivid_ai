import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const client = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const content = formData.get('content') as string
    const design = formData.get('design') as string
    const slideCount = parseInt(formData.get('slideCount') as string)
    const language = formData.get('language') as string

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const model = client.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `You are an expert presentation creator. Based on the following content, create ${slideCount} presentation slides in ${language}.

Content:
${content}

Design Style: ${design}

Please generate a JSON response with an array of slides. Each slide should have:
- title: A catchy, concise title for the slide
- content: The main content/bullet points for the slide (as a string with line breaks)

Format your response as valid JSON only, no other text:
{
  "title": "Main Topic",
  "slides": [
    {
      "title": "Slide Title",
      "content": "Point 1\\nPoint 2\\nPoint 3"
    }
  ]
}`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse the JSON response
    let parsedResponse
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      parsedResponse = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: `pres_${Date.now()}`,
      title: parsedResponse.title || 'Untitled Presentation',
      description: content.substring(0, 100),
      design,
      slideCount: parsedResponse.slides.length,
      language,
      slides: parsedResponse.slides.map((slide: any, index: number) => ({
        id: `slide_${index}`,
        title: slide.title,
        content: slide.content,
        order: index + 1,
      })),
    })
  } catch (error) {
    console.error('Error generating presentation:', error)
    return NextResponse.json(
      { error: 'Failed to generate presentation' },
      { status: 500 }
    )
  }
}
