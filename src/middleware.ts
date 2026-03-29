import { clerkMiddleware } from '@clerk/nextjs/server'

// Use default Clerk middleware; route protection can be handled per-route
export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!.+\\.[\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
