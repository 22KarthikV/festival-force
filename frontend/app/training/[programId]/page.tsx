"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/supabase"
import { getTrainingProgram, listModules, getProgress } from "@/lib/api"
import { calculateLevel } from "@/lib/utils"

export default function TrainingProgramPage() {
  const { programId } = useParams<{ programId: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [program, setProgram] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u) { router.push("/auth/login"); return }
      setUser(u)
      const [prog, mods, prog2] = await Promise.all([
        getTrainingProgram(programId),
        listModules(programId),
        getProgress(u.id, programId),
      ])
      setProgram(prog)
      setModules(mods)
      setProgress(prog2)
      setLoading(false)
    })
  }, [programId, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white animate-pulse">Loading training program...</div>
    </div>
  )

  const completedIds: string[] = progress?.completed_modules || []
  const completedCount = completedIds.length
  const progressPct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0
  const xp = progress?.xp_earned || 0
  const levelInfo = calculateLevel(xp)

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

      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{program?.title}</h1>
          <p className="text-white/60 mt-1">{program?.description}</p>
          <p className="text-white/40 text-sm mt-1">~{program?.estimated_minutes} minutes · Pass score: {program?.pass_score}%</p>
        </div>

        {/* XP + Level Bar */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="font-bold text-yellow-400">{xp} XP</span>
              <span className="text-white/50 ml-2 text-sm">· Level {levelInfo.level}: {levelInfo.title}</span>
            </div>
            <span className="text-white/50 text-sm">{levelInfo.progress}% to next level</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>

        {/* Progress ring */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold mb-1">Overall Progress</p>
              <p className="text-white/50 text-sm">{completedCount} of {modules.length} modules complete</p>
            </div>
            <div className="text-3xl font-bold text-violet-400">{progressPct}%</div>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Modules */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Training Modules</h2>
          {modules.map((mod, i) => {
            const done = completedIds.includes(mod.id)
            const isNext = !done && i === completedCount
            return (
              <Link
                key={mod.id}
                href={`/training/${programId}/module/${mod.id}`}
                className={`flex items-center justify-between p-5 rounded-2xl border transition ${
                  done
                    ? "bg-green-500/10 border-green-500/30"
                    : isNext
                    ? "bg-violet-500/10 border-violet-500/50 hover:bg-violet-500/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    done ? "bg-green-500 text-white" : isNext ? "bg-violet-500 text-white" : "bg-white/10 text-white/50"
                  }`}>
                    {done ? "✓" : i + 1}
                  </div>
                  <div>
                    <p className="font-medium">{mod.title}</p>
                    <p className="text-white/50 text-sm">+{mod.xp_reward} XP</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {done && <span className="text-green-400 text-sm">Complete</span>}
                  {isNext && <span className="text-violet-300 text-sm">Start →</span>}
                  {!done && !isNext && <span className="text-white/30 text-sm">Locked</span>}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Final Assessment */}
        {completedCount === modules.length && modules.length > 0 && (
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-pink-500/20 to-violet-500/20 border border-violet-500/30">
            <h2 className="text-xl font-bold mb-2">🏆 Final Assessment</h2>
            <p className="text-white/60 mb-4">You&apos;ve completed all modules! Take the final assessment to earn your certification and Shift-Ready Passport.</p>
            <Link
              href={`/training/${programId}/assessment`}
              className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 font-medium hover:opacity-90 transition"
            >
              {progress?.assessment_passed ? "View Results" : "Start Assessment →"}
            </Link>
            {progress?.assessment_passed && (
              <div className="mt-3 flex items-center gap-2 text-green-400">
                <span>✅</span>
                <span>Passed with {progress.assessment_score}%! You are Shift Ready.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
