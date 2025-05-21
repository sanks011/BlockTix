"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useWeb3 } from "@/lib/hooks/use-web3"

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false)
  const { address, connectWallet } = useWeb3()

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <section className="py-12 md:py-24">
      <motion.div
        className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center"
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={containerVariants}
      >
        <div className="space-y-4">
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm text-purple-500">
              <Zap className="mr-1 h-3 w-3" />
              Next-Gen Event Platform
            </div>
          </motion.div>
          <motion.h1
            className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-300"
            variants={itemVariants}
          >
            Events Reimagined with Blockchain
          </motion.h1>
          <motion.p className="text-zinc-400 md:text-xl" variants={itemVariants}>
            Create, discover, and attend events with secure blockchain ticketing. Own your tickets as NFTs, trade them,
            and unlock exclusive experiences.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-3" variants={itemVariants}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              asChild
            >
              <Link href="/events">Explore Events</Link>
            </Button>
            {!address ? (
              <Button
                size="lg"
                variant="outline"
                className="border-purple-500 text-purple-500 hover:bg-purple-500/10"
                onClick={() => connectWallet()}
              >
                Connect Wallet
              </Button>
            ) : (
              <Button
                size="lg"
                variant="outline"
                className="border-purple-500 text-purple-500 hover:bg-purple-500/10"
                asChild
              >
                <Link href="/create">Create Event</Link>
              </Button>
            )}
          </motion.div>
        </div>
        <motion.div className="relative" variants={itemVariants}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl -z-10" />
          <div className="rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900/50 backdrop-blur">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover rounded-3xl">
              <source
                src="https://cdn.pixabay.com/vimeo/328940142/concert-24538.mp4?width=1280&hash=f6d0bf4c4c0c2a7a8cbf2c6c48b5e0c2c5a730c0"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Experience the Future of Events</h2>
              <p className="text-zinc-300 mb-4">
                Secure, transparent, and unforgettable experiences powered by blockchain
              </p>
              <Button className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20">
                Learn More
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
