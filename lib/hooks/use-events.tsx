"use client"

import { useState, useEffect } from "react"
import { collection, query, where, orderBy, limit, doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Event } from "@/lib/types"

export function useEvents(options?: {
  limit?: number
  category?: string
  featured?: boolean
  creatorId?: string
  upcoming?: boolean
}) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    const eventsQuery = collection(db, "events")
    const constraints = []

    // Only show published events
    constraints.push(where("isPublished", "==", true))

    // Filter by category if provided
    if (options?.category) {
      constraints.push(where("category", "==", options.category))
    }

    // Filter by featured status if provided
    if (options?.featured !== undefined) {
      constraints.push(where("isFeatured", "==", options.featured))
    }

    // Filter by creator if provided
    if (options?.creatorId) {
      constraints.push(where("creatorId", "==", options.creatorId))
    }

    // Filter for upcoming events if requested
    if (options?.upcoming) {
      constraints.push(where("startDate", ">", new Date()))
    }

    // Order by start date
    constraints.push(orderBy("startDate", "asc"))

    // Apply limit if provided
    if (options?.limit) {
      constraints.push(limit(options.limit))
    }

    const q = query(eventsQuery, ...constraints)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const eventsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Event[]

        setEvents(eventsList)
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching events:", err)
        setError(err)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [options?.limit, options?.category, options?.featured, options?.creatorId, options?.upcoming])

  return { events, loading, error }
}

export async function getEventById(eventId: string): Promise<Event | null> {
  try {
    const eventDoc = await getDoc(doc(db, "events", eventId))

    if (eventDoc.exists()) {
      return { id: eventDoc.id, ...eventDoc.data() } as Event
    }

    return null
  } catch (error) {
    console.error("Error fetching event:", error)
    throw error
  }
}

export function useEventById(eventId: string) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!eventId) {
      setLoading(false)
      return
    }

    const unsubscribe = onSnapshot(
      doc(db, "events", eventId),
      (doc) => {
        if (doc.exists()) {
          setEvent({ id: doc.id, ...doc.data() } as Event)
        } else {
          setEvent(null)
        }
        setLoading(false)
      },
      (err) => {
        console.error("Error fetching event:", err)
        setError(err)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [eventId])

  return { event, loading, error }
}
