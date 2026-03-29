import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const model = await req.json()

    const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'presenton-pptx-'))
    const jsonPath = path.join(tmpRoot, 'model.json')
    const pptxPath = path.join(tmpRoot, 'presentation.pptx')

    await fs.writeFile(jsonPath, JSON.stringify(model, null, 2), 'utf8')

    const scriptPath = path.join(process.cwd(), 'scripts', 'generate_pptx.py')

    await new Promise<void>((resolve, reject) => {
      const child = spawn('python3', [scriptPath, jsonPath, pptxPath])

      let stderr = ''
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString()
      })

      child.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`python3 exited with code ${code}: ${stderr}`))
      })
    })

    const file = await fs.readFile(pptxPath)

    return new NextResponse(file, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="presentation.pptx"',
      },
    })
  } catch (err) {
    console.error('PPTX export error', err)
    return NextResponse.json({ error: 'Failed to export PPTX' }, { status: 500 })
  }
}
