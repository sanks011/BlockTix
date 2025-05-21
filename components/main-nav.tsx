"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Ticket, Plus, Menu, X } from "lucide-react"
import { WalletConnect } from "@/components/wallet-connect"
import { cn } from "@/lib/utils"
import { useWeb3 } from "@/lib/hooks/use-web3"

export function MainNav() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { address } = useWeb3()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed w-full z-50 transition-all duration-300",
        isScrolled ? "bg-black/80 backdrop-blur-lg border-b border-zinc-800" : "bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Ticket className="h-6 w-6 text-purple-500" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            BlockTix
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          <NavLink href="/events" active={pathname === "/events"}>
            Discover
          </NavLink>
          <NavLink href="/create" active={pathname === "/create"}>
            Create
          </NavLink>
          <NavLink href="/my-tickets" active={pathname === "/my-tickets"}>
            My Tickets
          </NavLink>
          <NavLink href="/fundraising" active={pathname === "/fundraising"}>
            Fundraising
          </NavLink>
          <NavLink href="/marketplace" active={pathname === "/marketplace"}>
            NFT Marketplace
          </NavLink>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
          <WalletConnect />
          {address && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="border-purple-500 text-purple-500 hover:bg-purple-500/10"
                asChild
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                asChild
              >
                <Link href="/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-lg border-b border-zinc-800">
          <nav className="container flex flex-col gap-4 px-4 py-6">
            <MobileNavLink href="/events" active={pathname === "/events"} onClick={() => setIsMobileMenuOpen(false)}>
              Discover
            </MobileNavLink>
            <MobileNavLink href="/create" active={pathname === "/create"} onClick={() => setIsMobileMenuOpen(false)}>
              Create
            </MobileNavLink>
            <MobileNavLink
              href="/my-tickets"
              active={pathname === "/my-tickets"}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              My Tickets
            </MobileNavLink>
            <MobileNavLink
              href="/fundraising"
              active={pathname === "/fundraising"}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Fundraising
            </MobileNavLink>
            <MobileNavLink
              href="/marketplace"
              active={pathname === "/marketplace"}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              NFT Marketplace
            </MobileNavLink>

            <div className="pt-4 mt-4 border-t border-zinc-800 flex flex-col gap-4">
              <WalletConnect />
              {address && (
                <>
                  <Button
                    variant="outline"
                    className="w-full border-purple-500 text-purple-500 hover:bg-purple-500/10"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    asChild
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href="/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Event
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

interface NavLinkProps {
  href: string
  active: boolean
  children: React.ReactNode
}

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-purple-400 relative",
        active ? "text-purple-400" : "text-white",
      )}
    >
      {children}
      {active && (
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
      )}
    </Link>
  )
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick: () => void
}

function MobileNavLink({ href, active, onClick, children }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "text-lg font-medium py-2 transition-colors hover:text-purple-400",
        active ? "text-purple-400" : "text-white",
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
