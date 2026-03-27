# Presenton - AI Presentation Maker

A full-stack AI-powered presentation generator built with Next.js, TanStack Query, PostgreSQL, Prisma, Zustand, and Google Gemini API.

## Tech Stack

- **Frontend**: Next.js 15+ with App Router, React, TypeScript, Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS

## Features

- 🤖 AI-powered presentation generation using Google Gemini
- 🎨 Multiple design styles (Standard, Modern, Minimal, Professional)
- 🌍 Multi-language support
- 📁 File attachment support (PDF, Word, PowerPoint, Excel, CSV)
- ⚡ Real-time UI state management with Zustand
- 📦 Type-safe API routes with TypeScript
- 🔄 Automatic data fetching and caching with TanStack Query
- 💾 Persistent database storage with Prisma

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Google Gemini API key

## Installation

1. **Clone the repository**
   ```bash
   cd /Users/harsh/Downloads/vivid_ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/vivid_ai"
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NODE_ENV="development"
   ```

4. **Set up the database**
   
   First, make sure PostgreSQL is running. Then run:
   ```bash
   npx prisma migrate dev --name init
   ```
   
   This will:
   - Create the database if it doesn't exist
   - Run migrations to create tables
   - Generate Prisma client

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

## Getting Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key" 
3. Copy your API key and paste it in `.env.local`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── presentations/
│   │       └── generate/
│   │           └── route.ts       # AI generation endpoint
│   ├── page.tsx                   # Homepage
│   └── layout.tsx                 # Root layout with providers
├── store/
│   └── presentationStore.ts       # Zustand store for presentation state
├── providers/
│   └── QueryProvider.tsx          # TanStack Query provider wrapper
└── generated/
    └── prisma/                    # Auto-generated Prisma client

prisma/
├── schema.prisma                  # Database schema
└── migrations/                    # Database migration files
```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server

# Database
npx prisma migrate dev  # Run migrations
npx prisma studio      # Open Prisma Studio UI
npx prisma generate    # Generate Prisma client

# Linting
npm run lint            # Run ESLint
```

## Usage

1. **Fill in the presentation details**:
   - Enter your presentation topic/content in the text area
   - Select design style, number of slides, and language
   - Optionally attach supporting files (PDF, Word docs, etc.)

2. **Generate presentation**:
   - Click "Generate Presentation"
   - The AI will analyze your content and create polished slides
   - Slides are generated with structured titles and content

3. **View & edit**:
   - Generated slides will appear in the state
   - You can edit individual slide content
   - Download or export the presentation

## Database Models

### User
- Stores user profile information
- Related to presentations

### Presentation
- Main presentation document
- Has multiple slides
- Stores design preferences, language, etc.

### Slide
- Individual presentation slides
- Contains title, content, and styling
- Belongs to a presentation

### GeneratedContent
- Caches AI-generated content for reference

## API Endpoints

### POST `/api/presentations/generate`
Generates presentation slides using Gemini AI.

**Request:**
- `content` (string): Presentation topic/content
- `design` (string): Design style
- `slideCount` (number): Number of slides to generate
- `language` (string): Target language
- `attachments` (File[]): Optional supporting files

**Response:**
```json
{
  "id": "pres_123",
  "title": "Generated Title",
  "slides": [
    {
      "id": "slide_0",
      "title": "Slide Title",
      "content": "Slide content",
      "order": 1
    }
  ]
}
```

## Configuration

- Edit design styles in `src/app/page.tsx` (design selector options)
- Add more languages in the language selector
- Modify Prisma schema in `prisma/schema.prisma`
- Adjust Gemini prompt in API route for better results

## Troubleshooting

### "Cannot find module '@google/generative-ai'"
```bash
npm install @google/generative-ai
```

### Database connection error
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env.local`
- Verify database exists

### API key error
- Verify `NEXT_PUBLIC_GEMINI_API_KEY` is set correctly
- Check you have access to Gemini API at aistudio.google.com

### Prisma client not found
```bash
npx prisma generate
```

## Next Steps

- [ ] Add authentication (NextAuth.js or Auth0)
- [ ] Create presentation editor/preview page
- [ ] Add presentation export (PPTX, PDF)
- [ ] Implement slide templates
- [ ] Add collaboration features
- [ ] Deploy to Vercel/other platforms

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
