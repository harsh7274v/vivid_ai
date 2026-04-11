import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userEmail = searchParams.get('userEmail')

    if (!userEmail) {
      return NextResponse.json({ presentations: [] })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        presentations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ presentations: [] })
    }

    const presentations = user.presentations.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      createdAt: p.createdAt,
      slideCount: p.slideCount,
      design: p.design,
      language: p.language,
    }))

    return NextResponse.json({ presentations })
  } catch (error) {
    console.error('Failed to load presentations history:', error)
    return NextResponse.json(
      { error: 'Failed to load presentations history' },
      { status: 500 }
    )
  }
}
