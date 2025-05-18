import Link from "next/link"

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <nav className="flex items-center space-x-4 lg:space-x-6 mx-6">
          <Link href="/service-selection" className="text-sm font-medium transition-colors hover:text-primary">
            Services
          </Link>
          <Link href="/hospital-list" className="text-sm font-medium transition-colors hover:text-primary">
            Hospitals
          </Link>
          <Link href="/hospital-dashboard" className="text-sm font-medium transition-colors hover:text-primary">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
