"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const defaultRole = params.get("role") as "employer" | "volunteer" | null

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"employer" | "volunteer">(defaultRole || "volunteer")
  const [orgName, setOrgName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError || !authData.user) {
      setError(authError?.message || "Sign up failed")
      setLoading(false)
      return
    }

    let orgId: string | null = null
    if (role === "employer" && orgName) {
      const { data: org } = await supabase.from("organizations").insert({ name: orgName }).select().single()
      orgId = org?.id || null
    }

    await supabase.from("users").insert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role,
      org_id: orgId,
    })

    if (role === "employer") {
      router.push("/employer/dashboard")
    } else {
      router.push("/training")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white text-2xl font-bold">
            <span>🎪</span> FestivalForce
          </Link>
          <p className="text-white/60 mt-2">Create your account</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white/10 backdrop-blur rounded-2xl p-8 border border-white/20">
          <h1 className="text-white text-2xl font-bold mb-6">Sign up</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{error}</div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(["employer", "volunteer"] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-3 rounded-lg border text-sm font-medium transition ${
                  role === r
                    ? "bg-violet-500 border-violet-500 text-white"
                    : "bg-white/5 border-white/20 text-white/60 hover:bg-white/10"
                }`}
              >
                {r === "employer" ? "🏢 Employer" : "🙋 Volunteer"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-violet-400"
                placeholder="Jane Smith"
                required
              />
            </div>
            {role === "employer" && (
              <div>
                <label className="block text-white/70 text-sm mb-1">Organisation Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-violet-400"
                  placeholder="The Voodoo Rooms"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-white/70 text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-violet-400"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-violet-400"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-white/50 text-center text-sm mt-4">
            Have an account?{" "}
            <Link href="/auth/login" className="text-violet-300 hover:text-violet-200">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
