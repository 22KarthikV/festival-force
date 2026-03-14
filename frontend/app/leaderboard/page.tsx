"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { getLeaderboard } from "@/lib/api"
import { Sparkles, Trophy, Medal, Star, Loader2, ArrowLeft, Shield } from "lucide-react"

export default function LeaderboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u) { router.push("/auth/login"); return }
      setUser(u)
      let orgId = u.org_id

      if (!orgId) {
        const { data: progress } = await supabase
          .from("volunteer_progress")
          .select("program_id")
          .eq("user_id", u.id)
          .limit(1)
          .single()
        if (progress?.program_id) {
          const { data: prog } = await supabase
            .from("training_programs")
            .select("org_id")
            .eq("id", progress.program_id)
            .single()
          orgId = prog?.org_id
        }
      }

      if (orgId) {
        const data = await getLeaderboard(orgId)
        setLeaders(data as any[])
      }
      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/60">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading leaderboard...</span>
      </div>
    </div>
  )

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-400" />
    return <span className="text-white/30 text-sm font-bold w-5 text-center">{rank}</span>
  }

  const getRankBg = (rank: number, isMe: boolean) => {
    if (isMe) return "bg-violet-500/10 border-violet-500/30 hover:border-violet-400/50"
    if (rank === 1) return "bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/35"
    if (rank <= 3) return "bg-white/5 border-white/10 hover:border-white/20"
    return "bg-white/5 border-white/5 hover:border-white/10"
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
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
          <Link
            href={`/passport/${user?.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            My Passport
          </Link>
        </div>
      </nav>

      <div className="relative max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="font-display text-3xl font-bold">Leaderboard</h1>
          <p className="text-white/40 text-sm mt-1">Top volunteers ranked by XP</p>
        </div>

        {leaders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10 border-dashed">
            <Star className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No volunteers enrolled yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((entry: any) => {
              const isMe = entry.user_id === user?.id
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${getRankBg(entry.rank, isMe)}`}
                >
                  {/* Rank */}
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Name + level */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{entry.full_name}</p>
                      {isMe && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-400 flex-shrink-0">you</span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">{entry.level_title}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-yellow-400 font-bold text-sm">{entry.xp} XP</p>
                    <p className="text-white/30 text-xs mt-0.5">{entry.badges_count} badge{entry.badges_count !== 1 ? "s" : ""}</p>
                  </div>

                  {/* Shift ready badge */}
                  {entry.shift_ready && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex-shrink-0">
                      <Shield className="w-3 h-3" />
                      Ready
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
