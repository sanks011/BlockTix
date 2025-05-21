"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Calendar, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface EventCardProps {
  id: string
  title: string
  date: string
  location: string
  image: string
  price: string
  category: string
}

export function EventCard({ id, title, date, location, image, price, category }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur transition-all hover:border-purple-500/50 hover:shadow-md hover:shadow-purple-500/10"
      whileHover={{ y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="aspect-video relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
        <motion.div animate={{ scale: isHovered ? 1.05 : 1 }} transition={{ duration: 0.3 }} className="h-full w-full">
          <Image src={image || "/placeholder.svg?height=400&width=600"} alt={title} fill className="object-cover" />
        </motion.div>
        <Badge className="absolute top-3 right-3 z-20 bg-purple-500 hover:bg-purple-600">{category}</Badge>
        <div className="absolute bottom-3 right-3 z-20">
          <Badge variant="outline" className="border-purple-500 text-purple-400 bg-black/50 backdrop-blur-sm">
            {price}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-1">{title}</h3>
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-zinc-400">
            <Calendar className="h-4 w-4 mr-2 text-purple-500" />
            {date}
          </div>
          <div className="flex items-center text-sm text-zinc-400">
            <MapPin className="h-4 w-4 mr-2 text-purple-500" />
            {location}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            asChild
          >
            <Link href={`/events/${id}`}>Buy Ticket</Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 hover:border-purple-500 hover:bg-purple-500/10"
            asChild
          >
            <Link href={`/events/${id}`}>Details</Link>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
