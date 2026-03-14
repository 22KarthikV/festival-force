"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Sparkles, Loader2, Building2, Users } from "lucide-react"

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
  const [emailSent, setEmailSent] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })
    if (authError || !authData.user) {
      setError(authError?.message || "Sign up failed")
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setEmailSent(true)
      setLoading(false)
      return
    }

    if (role === "employer" && orgName) {
      // Single atomic RPC — SECURITY DEFINER bypasses RLS, creates org + user profile together
      const { error: rpcError } = await supabase.rpc("create_employer_with_org", {
        p_user_id: authData.user.id,
        p_email: email,
        p_full_name: fullName,
        p_org_name: orgName,
      })
      if (rpcError) console.error("create_employer_with_org error:", rpcError)
    } else {
      // Volunteer — upsert profile only
      const { error: upsertError } = await supabase.from("users").upsert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
      })
      if (upsertError) console.error("User upsert error:", upsertError)
    }

    if (role === "employer") {
      router.push("/employer/dashboard")
    } else {
      router.push("/training")
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-3">Check your email</h1>
          <p className="text-white/50 mb-8 leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="text-white font-medium">{email}</span>.{" "}
            Click it to activate your account, then log in.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity duration-200"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">FestivalForce</span>
          </Link>
          <p className="text-white/50 text-sm">Create your account</p>
        </div>

        <form
          onSubmit={handleRegister}
          className="bg-gray-900 rounded-2xl p-8 border border-white/10 shadow-2xl shadow-black/50"
        >
          <h1 className="font-display text-2xl font-bold text-white mb-6">Sign up</h1>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(["employer", "volunteer"] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
                  role === r
                    ? "bg-violet-500/20 border-violet-400/50 text-violet-300"
                    : "bg-gray-800 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
                }`}
              >
                {r === "employer" ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {r === "employer" ? "Employer" : "Volunteer"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 transition-colors duration-200"
                placeholder="Jane Smith"
                required
              />
            </div>
            {role === "employer" && (
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wide">Organisation Name</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 transition-colors duration-200"
                  placeholder="The Voodoo Rooms"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 transition-colors duration-200"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 transition-colors duration-200"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : "Create account"}
          </button>

          <p className="text-white/40 text-center text-sm mt-5">
            Have an account?{" "}
            <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 transition-colors duration-200">
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
