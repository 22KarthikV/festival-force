"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/supabase"
import { getPassport } from "@/lib/api"
import { Sparkles, Trophy, Shield, Star, ArrowLeft, Award, CheckCircle2, Clock, Loader2, BookOpen } from "lucide-react"

export default function PassportPage() {
  const { userId } = useParams<{ userId: string }>()
  const router = useRouter()
  const [passport, setPassport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u) { router.push("/auth/login"); return }
      const p = await getPassport(userId)
      setPassport(p)
      setLoading(false)
    })
  }, [userId, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/60">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading passport...</span>
      </div>
    </div>
  )

  const levelGradients: Record<number, string> = {
    1: "from-slate-600 via-slate-700 to-slate-800",
    2: "from-blue-600 via-indigo-700 to-blue-900",
    3: "from-violet-600 via-purple-700 to-violet-900",
    4: "from-amber-500 via-orange-600 to-yellow-800",
  }

  const gradient = levelGradients[passport?.level] || levelGradients[1]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/3 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-base">FestivalForce</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/training"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Training
            </Link>
            <Link
              href="/leaderboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all duration-200"
            >
              <Trophy className="w-3.5 h-3.5" />
              Leaderboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative max-w-2xl mx-auto px-6 py-10">
        {/* Passport Card */}
        <div className={`relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br ${gradient} mb-8 shadow-2xl`}>
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white" />
            <div className="absolute top-8 right-8 w-20 h-20 rounded-full border-2 border-white" />
            <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full border-2 border-white" />
          </div>

          <div className="relative">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1.5 font-medium">Shift-Ready Passport</p>
                <h1 className="font-display text-2xl font-extrabold">{passport?.full_name || "Anonymous"}</h1>
                <p className="text-white/60 text-sm mt-1">{passport?.level_title}</p>
              </div>
              <div>
                {passport?.shift_ready ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/25 border border-green-400/40 text-green-300 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Shift Ready
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    In Training
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-white/10">
                <div className="font-display text-3xl font-extrabold">{passport?.xp || 0}</div>
                <div className="text-white/50 text-xs uppercase tracking-wide mt-1">Total XP</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/10">
                <div className="font-display text-3xl font-extrabold">L{passport?.level || 1}</div>
                <div className="text-white/50 text-xs uppercase tracking-wide mt-1">Level</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/10">
                <div className="font-display text-3xl font-extrabold">{passport?.readiness_score || 0}%</div>
                <div className="text-white/50 text-xs uppercase tracking-wide mt-1">Readiness</div>
              </div>
            </div>

            {passport?.verified_at && (
              <p className="text-white/35 text-xs mt-4">
                Verified {new Date(passport.verified_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {/* Certifications */}
        {passport?.certifications?.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-violet-400" />
              Certifications
            </h2>
            <div className="space-y-3">
              {passport.certifications.map((cert: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{cert.role}</p>
                      <p className="text-white/40 text-xs mt-0.5">{cert.org}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-sm">{cert.score}%</p>
                    <p className="text-white/30 text-xs mt-0.5">
                      {cert.passed_at ? new Date(cert.passed_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Badges */}
        {passport?.badges?.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Badges
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {passport.badges.map((badge: any) => (
                <div key={badge.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/15 transition-all duration-200">
                  <div className="text-2xl mb-2">{badge.icon}</div>
                  <p className="font-semibold text-sm">{badge.name}</p>
                  <p className="text-white/40 text-xs mt-0.5 leading-relaxed">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!passport?.shift_ready && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 border-dashed text-center">
            <BookOpen className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm mb-4">Complete your training to unlock your Shift-Ready Passport</p>
            <Link
              href="/training"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 transition-colors duration-200 font-medium text-sm"
            >
              Continue Training <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
