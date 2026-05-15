import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Presentation id is required' },
        { status: 400 }
      )
    }

    const presentation = await prisma.presentation.findUnique({
      where: { id },
      include: {
        slides: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 })
    }

    const slides = presentation.slides.map((slide, index) => {
      let parsedStyle: any = null
      if (slide.styleJson) {
        try {
          parsedStyle = JSON.parse(slide.styleJson)
        } catch {
          parsedStyle = null
        }
      }

      const contentLines = (slide.content || '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const imageSrc =
        parsedStyle && typeof parsedStyle === 'object'
          ? parsedStyle.imageSrc || parsedStyle.image_url || null
          : null

      return {
        id: slide.id,
        number: slide.order ?? index + 1,
        title: slide.title,
        content: contentLines,
        imageSrc,
        layoutData: parsedStyle && typeof parsedStyle === 'object' ? parsedStyle.layoutData || null : null,
        layoutIndex: parsedStyle && typeof parsedStyle === 'object' && typeof parsedStyle.layoutIndex === 'number' ? parsedStyle.layoutIndex : null,
      }
    })

    return NextResponse.json({
      id: presentation.id,
      title: presentation.title,
      description: presentation.description,
      design: presentation.design,
      language: presentation.language,
      slideCount: presentation.slideCount,
      createdAt: presentation.createdAt,
      updatedAt: presentation.updatedAt,
      slides,
    })
  } catch (error) {
    console.error('Failed to load presentation by id:', error)
    return NextResponse.json(
      { error: 'Failed to load presentation' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { slides, title, description } = body

    if (!id) {
      return NextResponse.json({ error: 'Presentation id is required' }, { status: 400 })
    }

    // Update presentation metadata
    await prisma.presentation.update({
      where: { id },
      data: {
        title: title || undefined,
        description: description || undefined,
        updatedAt: new Date(),
      },
    })

    if (slides && Array.isArray(slides)) {
      // Simple strategy: delete existing slides and re-create them to match the new order and content
      await prisma.slide.deleteMany({
        where: { presentationId: id },
      })

      const slidesToCreate = slides.map((slide: any, index: number) => {
        const styleData: any = {}
        if (slide.imageSrc) styleData.imageSrc = slide.imageSrc
        if (slide.layoutData) styleData.layoutData = slide.layoutData
        if (typeof slide.layoutIndex === 'number') styleData.layoutIndex = slide.layoutIndex

        return {
          presentationId: id,
          order: index + 1,
          title: slide.title,
          content: Array.isArray(slide.content) ? slide.content.join('\n') : String(slide.content || ''),
          styleJson: Object.keys(styleData).length > 0 ? JSON.stringify(styleData) : null,
        }
      })

      await prisma.slide.createMany({
        data: slidesToCreate,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update presentation:', error)
    return NextResponse.json({ error: 'Failed to update presentation' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Presentation id is required' },
        { status: 400 }
      )
    }

    await prisma.presentation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete presentation:', error)
    return NextResponse.json(
      { error: 'Failed to delete presentation' },
      { status: 500 }
    )
  }
}
