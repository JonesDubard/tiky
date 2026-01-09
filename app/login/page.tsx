'use client'

import { useState, useEffect, Suspense } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

// Create a separate component that uses useSearchParams
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard"
  const { data: session, status } = useSession()
  
  const [email, setEmail] = useState("admin@tikky.com")
  const [password, setPassword] = useState("admin123")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [debug, setDebug] = useState("")

  // Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl)
    }
  }, [status, router, callbackUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setDebug("")

    try {
      console.log("Attempting sign in...")
      setDebug("Attempting sign in...")
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      console.log("Sign in result:", result)
      setDebug(`Result: ${JSON.stringify(result, null, 2)}`)

      if (result?.error) {
        setError(`Sign in failed: ${result.error}`)
      } else if (result?.ok) {
        setDebug("Redirecting...")
        router.push(callbackUrl)
        router.refresh()
      } else {
        setError("Unexpected response from server")
      }
    } catch (err: any) {
      console.error("Sign in error:", err)
      setError(`Error: ${err.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Tiky Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {status === "loading" ? "Checking session..." : "Enter your credentials"}
          </p>
        </div>

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === "development" && debug && (
          <div className="bg-gray-100 p-4 rounded text-sm font-mono">
            <div className="font-bold mb-2">Debug:</div>
            <div className="whitespace-pre-wrap">{debug}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || status === "loading"}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : "Sign in"}
            </button>
          </div>

          <div className="text-center text-sm">
            <Link
              href="/"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              ← Back to home
            </Link>
          </div>

          {/* Session Status */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
              Session status: {status}
              {session && (
                <div className="mt-1">
                  Logged in as: {session.user?.email}
                </div>
              )}
            </div>
          )}
        </form>

        {/* Quick Test Buttons */}
        {process.env.NODE_ENV === "development" && (
          <div className="space-y-2">
            <button
              onClick={() => {
                setEmail("admin@tiky.com")
                setPassword("admin123")
              }}
              className="w-full text-sm bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded"
            >
              Load Test Credentials
            </button>
            <button
              onClick={() => router.push("/api/auth/signin")}
              className="w-full text-sm bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded"
            >
              Try Default NextAuth Page
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Main component with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading login page...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}