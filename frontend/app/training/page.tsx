"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { getPassport } from "@/lib/api"
import { calculateLevel } from "@/lib/utils"

export default function TrainingIndexPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [programs, setPrograms] = useState<any[]>([])
  const [passport, setPassport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u) { router.push("/auth/login"); return }
      setUser(u)

      // Get all available programs (org programs if in org, or all)
      const { data } = await supabase
        .from("training_programs")
        .select("*, roles(name)")
        .order("created_at", { ascending: false })

      setPrograms(data || [])

      try {
        const p = await getPassport(u.id)
        setPassport(p)
      } catch {}

      setLoading(false)
    })
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white animate-pulse">Loading...</div>
    </div>
  )

  const xp = passport?.xp || 0
  const levelInfo = calculateLevel(xp)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span>🎪</span> FestivalForce
        </Link>
        <div className="flex items-center gap-4">
          <Link href={`/passport/${user?.id}`} className="text-white/60 hover:text-white text-sm">
            My Passport
          </Link>
          <Link href="/leaderboard" className="text-white/60 hover:text-white text-sm">
            🏆
          </Link>
          <button onClick={handleSignOut} className="text-white/40 hover:text-white text-sm">Sign out</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Welcome + XP bar */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Welcome, {user?.full_name?.split(" ")[0] || "Volunteer"} 👋</h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-yellow-400 font-bold">{xp} XP</span>
            <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                style={{ width: `${levelInfo.progress}%` }}
              />
            </div>
            <span className="text-white/50 text-sm">Level {levelInfo.level}: {levelInfo.title}</span>
          </div>
        </div>

        {/* Passport status */}
        {passport?.shift_ready && (
          <div className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-400">You are Shift Ready!</p>
              <p className="text-white/50 text-sm">Your passport is verified · {passport.readiness_score}% readiness</p>
            </div>
            <Link href={`/passport/${user?.id}`} className="ml-auto text-sm text-green-400 hover:text-green-300">
              View Passport →
            </Link>
          </div>
        )}

        {/* Programs */}
        <h2 className="text-lg font-semibold mb-4">Available Training Programs</h2>
        {programs.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-white/5 border border-white/10">
            <p className="text-white/40">No training programs available yet.</p>
            <p className="text-white/30 text-sm mt-1">Ask your employer to generate training.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {programs.map((prog: any) => (
              <Link
                key={prog.id}
                href={`/training/${prog.id}`}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-white/10 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl">
                    🎓
                  </div>
                </div>
                <h3 className="font-bold mb-1">{prog.title}</h3>
                <p className="text-white/50 text-sm mb-3">{prog.description}</p>
                <div className="flex items-center gap-3 text-xs text-white/40">
                  <span>~{prog.estimated_minutes} min</span>
                  <span>·</span>
                  <span>Pass: {prog.pass_score}%</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
