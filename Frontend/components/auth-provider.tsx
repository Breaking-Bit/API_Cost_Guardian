"use client"

import type React from "react"

import { createContext, useEffect, useState } from "react"

interface AuthContextType {
  isAuthenticated: boolean
  token: string
  user: any | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: "",
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState("")
  const [user, setUser] = useState<any | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem("token")
    const storedUser = localStorage.getItem("user")

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/companies/login`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ email, password }),
        },
      )

      if (!response.ok) {
        throw new Error("Login failed")
      }

      const data = await response.json()

      // Store auth data
      localStorage.setItem("token", data.uid)
      localStorage.setItem("user", JSON.stringify(data.company))

      setToken(data.uid)
      setUser(data.company)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/companies/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        },
      )

      if (!response.ok) {
        throw new Error("Registration failed")
      }

      const data = await response.json()

      // Store auth data
      localStorage.setItem("token", data.uid)
      localStorage.setItem("user", JSON.stringify(data.company))

      setToken(data.uid)
      setUser(data.company)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setToken("")
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
