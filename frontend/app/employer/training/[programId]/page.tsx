"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/supabase"
import { getTrainingProgram, listModules } from "@/lib/api"

export default function EmployerTrainingPage() {
  const { programId } = useParams<{ programId: string }>()
  const router = useRouter()
  const [program, setProgram] = useState<any>(null)
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u || u.role !== "employer") { router.push("/auth/login"); return }
      const [prog, mods] = await Promise.all([
        getTrainingProgram(programId),
        listModules(programId),
      ])
      setProgram(prog)
      setModules(mods as any[])
      setLoading(false)
    })
  }, [programId, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white animate-pulse">Loading program...</div>
    </div>
  )

  const trainingUrl = `${window.location.origin}/training/${programId}`

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href="/employer/dashboard" className="text-white/60 hover:text-white text-sm">
          ← Dashboard
        </Link>
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span>🎪</span> FestivalForce
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{program?.title}</h1>
          <p className="text-white/60 mt-1">{program?.description}</p>
          <p className="text-white/40 text-sm mt-1">~{program?.estimated_minutes} min · Pass: {program?.pass_score}%</p>
        </div>

        {/* Share link */}
        <div className="p-5 rounded-2xl bg-violet-500/10 border border-violet-500/30 mb-8">
          <p className="text-violet-300 font-medium mb-2">Share with volunteers:</p>
          <div className="flex gap-3 items-center">
            <code className="flex-1 text-sm bg-white/5 px-3 py-2 rounded-lg text-white/70 overflow-x-auto">
              {trainingUrl}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(trainingUrl)}
              className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 transition text-sm font-medium whitespace-nowrap"
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* Modules */}
        <h2 className="text-lg font-bold mb-4">Generated Modules ({modules.length})</h2>
        <div className="space-y-4">
          {modules.map((mod, i) => (
            <div key={mod.id} className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{mod.title}</p>
                    <p className="text-white/50 text-sm mt-0.5">
                      {mod.content?.slides?.length || 0} slides · +{mod.xp_reward} XP
                    </p>
                    {mod.content?.learning_objectives?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mod.content.learning_objectives.map((obj: string, j: number) => (
                          <span key={j} className="px-2 py-0.5 rounded bg-white/10 text-white/50 text-xs">{obj}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-white/30 text-sm">✓ Generated</span>
              </div>
            </div>
          ))}
        </div>

        {modules.length === 0 && (
          <div className="p-8 text-center text-white/40">
            <p className="animate-pulse">Generating training modules...</p>
          </div>
        )}
      </div>
    </div>
  )
}
