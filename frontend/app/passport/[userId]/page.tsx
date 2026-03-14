"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/supabase"
import { getPassport } from "@/lib/api"

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
      <div className="text-white animate-pulse">Loading passport...</div>
    </div>
  )

  const levelColors: Record<number, string> = {
    1: "from-gray-500 to-gray-700",
    2: "from-blue-500 to-indigo-700",
    3: "from-violet-500 to-purple-700",
    4: "from-yellow-500 to-orange-600",
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span>🎪</span> FestivalForce
        </Link>
        <Link href="/leaderboard" className="text-white/60 hover:text-white text-sm">
          🏆 Leaderboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        {/* Passport Card */}
        <div className={`p-8 rounded-3xl bg-gradient-to-br ${levelColors[passport?.level] || levelColors[1]} mb-8 shadow-2xl`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/60 text-sm uppercase tracking-widest mb-1">Shift-Ready Passport</p>
              <h1 className="text-2xl font-extrabold">{passport?.full_name || "Anonymous"}</h1>
            </div>
            <div className="text-right">
              {passport?.shift_ready ? (
                <div className="px-3 py-1.5 rounded-full bg-green-500/30 border border-green-500/50 text-green-300 text-sm font-medium">
                  ✅ Shift Ready
                </div>
              ) : (
                <div className="px-3 py-1.5 rounded-full bg-yellow-500/30 border border-yellow-500/50 text-yellow-300 text-sm font-medium">
                  🔄 In Training
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-extrabold">{passport?.xp || 0}</div>
              <div className="text-white/60 text-xs uppercase">Total XP</div>
            </div>
            <div className="text-center border-x border-white/20">
              <div className="text-3xl font-extrabold">L{passport?.level || 1}</div>
              <div className="text-white/60 text-xs uppercase">Level</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">{passport?.readiness_score || 0}%</div>
              <div className="text-white/60 text-xs uppercase">Readiness</div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20">
            <p className="text-white/60 text-sm">{passport?.level_title}</p>
            {passport?.verified_at && (
              <p className="text-white/40 text-xs mt-1">
                Verified {new Date(passport.verified_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Certifications */}
        {passport?.certifications?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Certifications</h2>
            <div className="space-y-3">
              {passport.certifications.map((cert: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="font-medium">{cert.role}</p>
                    <p className="text-white/50 text-sm">{cert.org}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">{cert.score}%</p>
                    <p className="text-white/40 text-xs">
                      {cert.passed_at ? new Date(cert.passed_at).toLocaleDateString() : ""}
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
            <h2 className="text-lg font-bold mb-4">Badges</h2>
            <div className="grid grid-cols-2 gap-3">
              {passport.badges.map((badge: any) => (
                <div key={badge.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <p className="font-medium text-sm">{badge.name}</p>
                  <p className="text-white/50 text-xs mt-0.5">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!passport?.shift_ready && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-white/60 mb-3">Complete your training to unlock your Shift-Ready Passport</p>
            <Link href="/training" className="inline-block px-6 py-3 rounded-lg bg-violet-500 hover:bg-violet-400 transition font-medium">
              Continue Training →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
