"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { getLeaderboard } from "@/lib/api"

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

      // Volunteers don't have org_id — look it up via their enrolled programs
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

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return `#${rank}`
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white animate-pulse">Loading leaderboard...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span>🎪</span> FestivalForce
        </Link>
        <Link href={`/passport/${user?.id}`} className="text-white/60 hover:text-white text-sm">
          My Passport →
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-white/50 mt-1">Top volunteers ranked by XP</p>
        </div>

        {leaders.length === 0 ? (
          <p className="text-center text-white/40">No volunteers enrolled yet.</p>
        ) : (
          <div className="space-y-3">
            {leaders.map((entry: any) => {
              const isMe = entry.user_id === user?.id
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition ${
                    isMe
                      ? "bg-violet-500/20 border-violet-500/50"
                      : entry.rank <= 3
                      ? "bg-yellow-500/10 border-yellow-500/20"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="w-10 text-center text-xl font-bold">{rankEmoji(entry.rank)}</div>
                  <div className="flex-1">
                    <p className="font-semibold">{entry.full_name} {isMe && <span className="text-violet-400 text-xs">(you)</span>}</p>
                    <p className="text-white/50 text-sm">{entry.level_title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">{entry.xp} XP</p>
                    <p className="text-white/40 text-xs">{entry.badges_count} badges</p>
                  </div>
                  {entry.shift_ready && (
                    <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs whitespace-nowrap">
                      Shift Ready
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
