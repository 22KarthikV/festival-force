"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/supabase"
import { getModule, getModuleQuiz } from "@/lib/api"

export default function ModulePage() {
  const { programId, moduleId } = useParams<{ programId: string; moduleId: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mod, setMod] = useState<any>(null)
  const [quiz, setQuiz] = useState<any>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u) { router.push("/auth/login"); return }
      setUser(u)
      const [modData, quizData] = await Promise.all([
        getModule(moduleId),
        getModuleQuiz(moduleId).catch(() => null),
      ])
      setMod(modData)
      setQuiz(quizData)
      setLoading(false)
    })
  }, [moduleId, router])

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white animate-pulse">Loading module...</div>
    </div>
  )

  const slides: any[] = mod?.content?.slides || []
  const objectives: string[] = mod?.content?.learning_objectives || []
  const currentSlide = slides[slideIndex]
  const isLast = slideIndex === slides.length - 1

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href={`/training/${programId}`} className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
          ← Back to program
        </Link>
        <div className="text-white/50 text-sm">
          Slide {slideIndex + 1} / {slides.length}
        </div>
      </nav>

      <div className="flex-1 max-w-3xl mx-auto px-8 py-10 w-full">
        {/* Module header */}
        <div className="mb-8">
          <p className="text-violet-400 text-sm font-medium mb-1">Training Module</p>
          <h1 className="text-3xl font-bold">{mod?.title}</h1>
          {objectives.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {objectives.map((obj: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs">{obj}</span>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${((slideIndex + 1) / slides.length) * 100}%` }}
          />
        </div>

        {/* Slide card */}
        {currentSlide && (
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 min-h-[300px]">
            <h2 className="text-2xl font-bold mb-4 text-violet-300">{currentSlide.title}</h2>
            <p className="text-white/80 leading-relaxed mb-6">{currentSlide.content}</p>

            {currentSlide.key_points?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-3">Key Points</p>
                <ul className="space-y-2">
                  {currentSlide.key_points.map((point: string, i: number) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-violet-400 mt-0.5">→</span>
                      <span className="text-white/70">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setSlideIndex(i => Math.max(0, i - 1))}
            disabled={slideIndex === 0}
            className="px-6 py-3 rounded-lg border border-white/20 hover:bg-white/10 transition disabled:opacity-30"
          >
            ← Previous
          </button>

          {!isLast ? (
            <button
              onClick={() => setSlideIndex(i => i + 1)}
              className="px-6 py-3 rounded-lg bg-violet-500 hover:bg-violet-400 transition font-medium"
            >
              Next →
            </button>
          ) : (
            <Link
              href={quiz ? `/training/${programId}/quiz/${quiz.id}` : `/training/${programId}`}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 font-medium hover:opacity-90 transition"
            >
              {quiz ? "Take Quiz →" : "Complete Module →"}
            </Link>
          )}
        </div>

        {/* XP reminder */}
        {isLast && (
          <p className="text-center text-white/40 text-sm mt-4">
            Complete this module to earn +{mod?.xp_reward} XP
          </p>
        )}
      </div>
    </div>
  )
}
