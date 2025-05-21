"use client"

import { useEffect, useState } from "react"

export function BackgroundVideo() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!isLoaded) return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-black/80 z-10" />
      <video autoPlay loop muted playsInline className="absolute w-full h-full object-cover">
        <source
          src="https://cdn.pixabay.com/vimeo/414788377/abstract-41060.mp4?width=1280&hash=e9f8f3c2a7e4d1a3c8b2c6c4d1a3c8b2c6c4d1a3"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
    </div>
  )
}
