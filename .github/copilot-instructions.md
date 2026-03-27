# Presenton - AI Presentation Maker Development Guide

## Project Overview

Presenton is a full-stack AI-powered presentation generator built with:
- **Frontend**: Next.js 15+ App Router with TypeScript
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Database**: PostgreSQL + Prisma ORM
- **AI**: Google Gemini API
- **Styling**: Tailwind CSS

## Development Guidelines

### 1. File Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   ├── layout.tsx             # Root layout with providers
│   └── page.tsx               # Homepage
├── components/                # Reusable React components
├── store/                     # Zustand stores
├── providers/                 # Context/Provider wrappers
├── lib/                       # Utility functions
├── hooks/                     # Custom React hooks
└── types/                     # TypeScript types

prisma/
├── schema.prisma              # Database schema
└── migrations/                # Database migrations
```

### 2. Coding Standards

- **Language**: TypeScript strict mode
- **Components**: Always use `'use client'` for client components
- **Styling**: Tailwind CSS utility-first approach
- **State Management**: Use Zustand for global state
- **Data Fetching**: Use TanStack Query with `useMutation` and `useQuery`
- **Database**: Always use Prisma actions, never raw SQL

### 3. Environment Variables

Required `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/vivid_ai"
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. API Routes

- Place in `src/app/api/[resource]/[action]/route.ts`
- Use TypeScript for type safety
- Return `NextResponse.json()` for responses
- Handle errors with proper HTTP status codes

Example:
```typescript
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    // Process data
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'error message' }, { status: 500 })
  }
}
```

### 5. Zustand Store Patterns

```typescript
import { create } from 'zustand'

interface MyState {
  value: string
  setValue: (value: string) => void
}

export const useMyStore = create<MyState>((set) => ({
  value: '',
  setValue: (value) => set({ value }),
}))
```

### 6. TanStack Query Usage

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['presentations', id],
  queryFn: () => fetch(`/api/presentations/${id}`).then(r => r.json()),
})

const mutation = useMutation({
  mutationFn: (data) => fetch('/api/generate', { method: 'POST', body: JSON.stringify(data) }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['presentations'] }),
})
```

### 7. Prisma Database

- Define models in `prisma/schema.prisma`
- Run migrations: `npx prisma migrate dev --name description`
- Generate client: `npx prisma generate`
- Never commit `.env` files
- Always use relations for foreign keys

### 8. Component Patterns

```typescript
'use client'

interface ComponentProps {
  title: string
  onSubmit: (data: any) => void
}

export default function Component({ title, onSubmit }: ComponentProps) {
  return <div>{title}</div>
}
```

## Common Tasks

### Adding a New API Endpoint

1. Create file: `src/app/api/resource/action/route.ts`
2. Import necessary types and utilities
3. Implement handler function (GET, POST, etc.)
4. Return typed response with `NextResponse.json()`
5. Add unit tests

### Adding a New Database Model

1. Edit `prisma/schema.prisma`
2. Define model with proper relations
3. Run: `npx prisma migrate dev --name model_description`
4. Use generated types in API routes

### Creating a New Store

1. Create file: `src/store/storeName.ts`
2. Define TypeScript interface for state
3. Export hook with `create<Interface>`
4. Import and use with `const state = useStore()`

### Adding New UI Component

1. Create file: `src/components/ComponentName.tsx`
2. Add `'use client'` if interactive
3. Use Tailwind for styling
4. Export as default
5. Import and use in pages

## Database Models

### User
```prisma
model User {
  id String @id @default(cuid())
  email String @unique
  name String?
  presentations Presentation[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Presentation
```prisma
model Presentation {
  id String @id @default(cuid())
  title String
  description String?
  userId String
  design String @default("standard")
  slideCount Int @default(5)
  language String @default("English")
  slides Slide[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Slide
```prisma
model Slide {
  id String @id @default(cuid())
  presentationId String
  order Int
  title String
  content String
  styleJson String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Git Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes following coding standards
3. Run linter: `npm run lint`
4. Build check: `npm run build`
5. Commit with clear message
6. Push and create pull request

## Testing

- Unit tests for utilities
- Component tests for UI
- Integration tests for API routes
- Test data should use factories/fixtures

Commands:
```bash
npm test              # Run tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## Performance Considerations

1. Use React.memo for expensive components
2. Implement proper query key patterns in TanStack Query
3. Optimize images with Next.js Image component
4. Use code splitting with dynamic imports
5. Monitor bundle size with `npm run build`

## Security

1. Keep API keys in `.env.local` only
2. Validate all user input server-side
3. Use CORS for API if needed
4. Sanitize database queries (Prisma does this)
5. Never expose sensitive data in client code

## Deployment

1. Build: `npm run build`
2. Start: `npm start`
3. Environment variables set on platform
4. Database migrations run before deploy
5. Check logs for errors

## Troubleshooting

### Build fails
- Check `npm run lint` output
- Verify TypeScript types: `npx tsc --noEmit`
- Clear `.next`: `rm -rf .next`

### Database issues
- Verify connection string
- Check PostgreSQL is running
- Run migrations: `npx prisma migrate dev`
- Generate client: `npx prisma generate`

### API errors
- Check `.env.local` for missing variables
- Verify API route path syntax
- Check request/response formatting
- Review error logs

## Useful Commands

```bash
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # Run ESLint
npm run format               # Format with Prettier
npx prisma migrate dev       # Run migrations
npx prisma studio           # Open Database UI
npm test                      # Run tests
npm run type-check           # Type checking only
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Google Gemini API](https://ai.google.dev/)

## Project Status

- ✅ Initial setup complete
- ✅ Homepage UI implemented
- ✅ Database schema created
- ✅ Zustand store created
- ✅ TanStack Query provider configured
- ✅ Gemini API integration started
- ⏳ Authentication (Next Auth)
- ⏳ Presentation editor
- ⏳ Export functionality
- ⏳ Deployment

## Contact & Support

For questions or issues, refer to README.md or check documentation links above.
