import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAmbulanceRoute = createRouteMatcher(['/ambulance(.*)'])
const isHopitalRoute = createRouteMatcher(['/hopital(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims } = await auth()
  const userRole = sessionClaims?.metadata?.role

  // Protect all routes starting with `/ambulance`
  if (isAmbulanceRoute(req) && userRole !== 'ambulance') {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }

  // Protect all routes starting with `/hopital`
  if (isHopitalRoute(req) && userRole !== 'hopital') {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }
  
  // Protect all routes starting with `/admin`
  if (isAdminRoute(req) && userRole !== 'admin') {
    const url = new URL('/', req.url)
    return NextResponse.redirect(url)
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}