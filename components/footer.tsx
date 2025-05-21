import Link from "next/link"
import { Ticket } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-black/80 backdrop-blur-sm py-8 relative z-10">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Ticket className="h-6 w-6 text-purple-500" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
                BlockTix
              </span>
            </Link>
            <p className="text-zinc-400 text-sm">
              The next generation of event experiences powered by blockchain technology.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4">Platform</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/events" className="hover:text-purple-400 transition-colors">
                  Discover Events
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-purple-400 transition-colors">
                  Create Event
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-purple-400 transition-colors">
                  NFT Marketplace
                </Link>
              </li>
              <li>
                <Link href="/fundraising" className="hover:text-purple-400 transition-colors">
                  Fundraising
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/help" className="hover:text-purple-400 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-purple-400 transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/api" className="hover:text-purple-400 transition-colors">
                  API
                </Link>
              </li>
              <li>
                <Link href="/community" className="hover:text-purple-400 transition-colors">
                  Community
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>
                <Link href="/about" className="hover:text-purple-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-purple-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-purple-400 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-purple-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-zinc-500">&copy; {new Date().getFullYear()} BlockTix. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/terms" className="text-zinc-400 hover:text-purple-400 transition-colors text-xs">
              Terms
            </Link>
            <Link href="/privacy" className="text-zinc-400 hover:text-purple-400 transition-colors text-xs">
              Privacy
            </Link>
            <Link href="/cookies" className="text-zinc-400 hover:text-purple-400 transition-colors text-xs">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
