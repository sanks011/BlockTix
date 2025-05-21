"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, signInWithCustomToken, signOut as firebaseSignOut } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import type { User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  loading: boolean
  connectWallet: (walletAddress: string, walletType: string, token: string) => Promise<void>
  disconnectWallet: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
        if (userDoc.exists()) {
          setUser(userDoc.data() as User)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const connectWallet = async (walletAddress: string, walletType: string, token: string) => {
    try {
      // Sign in with custom token (generated from backend after wallet signature verification)
      const userCredential = await signInWithCustomToken(auth, token)

      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))

      if (!userDoc.exists()) {
        // Create new user document
        const newUser: Omit<User, "id"> = {
          walletAddress,
          walletType,
          createdAt: serverTimestamp() as any,
          updatedAt: serverTimestamp() as any,
        }

        await setDoc(doc(db, "users", userCredential.user.uid), newUser)

        setUser({ id: userCredential.user.uid, ...newUser })
      } else {
        // Update existing user
        const userData = userDoc.data() as Omit<User, "id">
        await setDoc(
          doc(db, "users", userCredential.user.uid),
          {
            walletAddress,
            walletType,
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )

        setUser({ id: userCredential.user.uid, ...userData, walletAddress, walletType })
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
      throw error
    }
  }

  const disconnectWallet = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
    } catch (error) {
      console.error("Error disconnecting wallet:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, connectWallet, disconnectWallet }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
