import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, Zap, QrCode, Coins, Globe, Users } from "lucide-react"
import { MainNav } from "@/components/main-nav"
import { HeroSection } from "@/components/hero-section"
import { TrendingEvents } from "@/components/trending-events"
import { NFTGallery } from "@/components/nft-gallery"
import { FeaturedEvent } from "@/components/featured-event"
import { FundraisingCampaigns } from "@/components/fundraising-campaigns"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen">
      <MainNav />

      <main className="container px-4 pt-24 pb-16 md:px-6 relative z-10">
        {/* Hero Section */}
        <HeroSection />

        {/* Trending Events */}
        <section className="py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              <TrendingUp className="inline mr-2 h-5 w-5 text-purple-500" />
              Trending Events
            </h2>
            <Button variant="link" className="text-purple-400" asChild>
              <Link href="/events">View all</Link>
            </Button>
          </div>
          <TrendingEvents />
        </section>

        {/* Featured Event */}
        <section className="py-12">
          <h2 className="text-2xl font-bold mb-6">Featured Event</h2>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl -z-10" />
            <div className="rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/50 backdrop-blur">
              <FeaturedEvent />
            </div>
          </div>
        </section>

        {/* Fundraising Campaigns */}
        <section className="py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              <Coins className="inline mr-2 h-5 w-5 text-purple-500" />
              Fundraising Campaigns
            </h2>
            <Button variant="link" className="text-purple-400" asChild>
              <Link href="/fundraising">View all</Link>
            </Button>
          </div>
          <FundraisingCampaigns />
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-24">
          <h2 className="text-3xl font-bold text-center mb-12">Revolutionary Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:translate-y-[-5px]">
              <Wallet className="h-10 w-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-2">Multi-Wallet Support</h3>
              <p className="text-zinc-400">
                Connect with MetaMask, Coinbase Wallet, WalletConnect, and more. Full compatibility with all major Web3
                wallets.
              </p>
            </div>
            <div className="group bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:translate-y-[-5px]">
              <QrCode className="h-10 w-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-2">Dynamic QR Codes</h3>
              <p className="text-zinc-400">
                Secure entry with blockchain-verified QR codes that prevent counterfeiting and enable seamless check-in.
              </p>
            </div>
            <div className="group bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:translate-y-[-5px]">
              <Coins className="h-10 w-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-2">Fundraising</h3>
              <p className="text-zinc-400">
                Create fundraising campaigns for your events. Set goals, track donations, and engage with supporters
                through blockchain.
              </p>
            </div>
            <div className="group bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:translate-y-[-5px]">
              <Globe className="h-10 w-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-2">Virtual Extensions</h3>
              <p className="text-zinc-400">
                Attend events virtually with immersive experiences. Digital twins of physical venues with interactive
                elements.
              </p>
            </div>
            <div className="group bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:translate-y-[-5px]">
              <Users className="h-10 w-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-2">Event Management</h3>
              <p className="text-zinc-400">
                Comprehensive tools for event creators to manage attendees, ticket sales, and event details in
                real-time.
              </p>
            </div>
            <div className="group bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300 hover:translate-y-[-5px]">
              <Zap className="h-10 w-10 text-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-2">NFT Tickets</h3>
              <p className="text-zinc-400">
                Own your tickets as unique NFTs. Collect, trade, and unlock special benefits with blockchain-verified
                authenticity.
              </p>
            </div>
          </div>
        </section>

        {/* NFT Showcase */}
        <section className="py-12">
          <h2 className="text-2xl font-bold mb-6">Featured NFT Tickets</h2>
          <NFTGallery />
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-24">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm" />
            <div className="relative p-8 md:p-12 lg:p-16">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to Revolutionize Your Events?</h2>
                <p className="text-lg text-zinc-300">
                  Join thousands of creators and attendees in the future of event experiences. Create your first
                  blockchain-powered event today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    asChild
                  >
                    <Link href="/create">Create Your First Event</Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20" asChild>
                    <Link href="/events">Explore Events</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
