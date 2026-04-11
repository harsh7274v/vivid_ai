import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'

interface SaveSlideInput {
  title: string
  content: string[]
  imageSrc?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      userEmail,
      title,
      description,
      design,
      language,
      slides,
    }: {
      userEmail?: string
      title?: string
      description?: string
      design?: string
      language?: string
      slides?: SaveSlideInput[]
    } = body

    if (!userEmail || !title || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: 'userEmail, title and slides are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.upsert({
      where: { email: userEmail },
      update: {},
      create: {
        email: userEmail,
      },
    })

    const slidesWithCloudinary = await Promise.all(
      (slides || []).map(async (slide, index) => {
        let finalImageSrc = slide.imageSrc ?? null

        if (slide.imageSrc && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
          try {
            const upload = await cloudinary.uploader.upload(slide.imageSrc, {
              folder: 'presenton/slides',
              overwrite: false,
              transformation: [
                { quality: 'auto', fetch_format: 'auto' },
              ],
            })
            finalImageSrc = upload.secure_url
          } catch (err) {
            console.error('Cloudinary upload failed for slide', index + 1, err)
            // Fallback: keep original imageSrc so slide still works
            finalImageSrc = slide.imageSrc
          }
        }

        return {
          order: index + 1,
          title: slide.title,
          content: Array.isArray(slide.content)
            ? slide.content.join('\n')
            : String(slide.content ?? ''),
          styleJson: finalImageSrc
            ? JSON.stringify({ imageSrc: finalImageSrc })
            : undefined,
        }
      })
    )

    const presentation = await prisma.presentation.create({
      data: {
        title,
        description: description || null,
        userId: user.id,
        design: design || 'standard',
        slideCount: slides.length,
        language: language || 'English',
        slides: {
          create: slidesWithCloudinary,
        },
      },
      include: {
        slides: true,
      },
    })

    return NextResponse.json({ id: presentation.id })
  } catch (error) {
    console.error('Failed to save presentation:', error)
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined
    console.error('Save error details:', { message, stack })
    return NextResponse.json(
      {
        error: 'Failed to save presentation',
        details: message,
      },
      { status: 500 }
    )
  }
}
