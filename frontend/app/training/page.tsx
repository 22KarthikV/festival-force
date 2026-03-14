"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { getPassport } from "@/lib/api"
import { calculateLevel } from "@/lib/utils"
import { Sparkles, Trophy, Clock, CheckCircle, BookOpen, ArrowRight, LogOut, Loader2 } from "lucide-react"

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
      <div className="flex items-center gap-3 text-white/60">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading your training...</span>
      </div>
    </div>
  )

  const xp = passport?.xp || 0
  const levelInfo = calculateLevel(xp)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Ambient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-base">FestivalForce</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href={`/passport/${user?.id}`}
              className="px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all duration-200"
            >
              My Passport
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all duration-200"
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/5 text-sm transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-4xl mx-auto px-6 py-10">
        {/* Welcome + XP */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-1">
            Welcome back, {user?.full_name?.split(" ")[0] || "Volunteer"}
          </h1>
          <p className="text-white/50 text-sm mb-4">Continue your training journey</p>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 max-w-md">
            <div className="text-center min-w-fit">
              <div className="font-display text-xl font-bold text-yellow-400">{xp}</div>
              <div className="text-white/40 text-xs">XP</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/60 text-xs">Level {levelInfo.level}: {levelInfo.title}</span>
                <span className="text-white/40 text-xs">{Math.round(levelInfo.progress)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${levelInfo.progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Shift Ready banner */}
        {passport?.shift_ready && (
          <div className="mb-6 p-4 rounded-2xl bg-green-500/8 border border-green-500/25 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-400 text-sm">You are Shift Ready</p>
              <p className="text-white/40 text-xs mt-0.5">Passport verified · {passport.readiness_score}% readiness</p>
            </div>
            <Link
              href={`/passport/${user?.id}`}
              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors duration-200 flex-shrink-0"
            >
              View Passport <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Programs */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">Available Training Programs</h2>
          <span className="text-white/30 text-xs">{programs.length} program{programs.length !== 1 ? "s" : ""}</span>
        </div>

        {programs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 border-dashed">
            <BookOpen className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No training programs available yet.</p>
            <p className="text-white/25 text-xs mt-1">Ask your employer to generate training.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {programs.map((prog: any) => (
              <Link
                key={prog.id}
                href={`/training/${prog.id}`}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-white/5 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/25 transition-colors duration-200">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
                <h3 className="font-display font-bold mb-1">{prog.title}</h3>
                <p className="text-white/45 text-sm mb-4 line-clamp-2">{prog.description}</p>
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    ~{prog.estimated_minutes} min
                  </span>
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
