"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/supabase"
import { getProgramAssessment, submitAssessment } from "@/lib/api"

export default function AssessmentPage() {
  const { programId } = useParams<{ programId: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [assessment, setAssessment] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u) { router.push("/auth/login"); return }
      setUser(u)
      const a = await getProgramAssessment(programId)
      setAssessment(a)
      setLoading(false)
    })
  }, [programId, router])

  const handleSubmit = async () => {
    if (!user || !assessment) return
    setSubmitting(true)
    const res = await submitAssessment(assessment.id, {
      user_id: user.id,
      program_id: programId,
      answers,
    })
    setResult(res)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white animate-pulse">Loading assessment...</div>
    </div>
  )

  const questions: any[] = assessment?.questions || []
  const answered = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href={`/training/${programId}`} className="text-white/60 hover:text-white text-sm">
          ← Back to program
        </Link>
        <p className="text-white/50 text-sm">Final Assessment · {answered}/{questions.length}</p>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm mb-3">
            🏆 Final Assessment
          </div>
          <h1 className="text-2xl font-bold">Certification Assessment</h1>
          <p className="text-white/50 text-sm mt-1">
            10 questions · Pass score: {assessment?.pass_score}% · Earn your Shift-Ready Passport on pass
          </p>
        </div>

        {/* Passed result */}
        {result?.passed && (
          <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-400 mb-2">Certified!</h2>
            <p className="text-white/70 mb-2">Score: {result.score}%</p>
            <p className="text-yellow-400 font-medium mb-4">+{result.xp_awarded} XP earned!</p>

            {result.badges_earned?.length > 0 && (
              <div className="mb-4">
                <p className="text-white/50 text-sm mb-2">Badges earned:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {result.badges_earned.map((b: any) => (
                    <span key={b.id} className="px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-300 text-sm font-medium">
                      {b.icon} {b.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.shift_ready && (
              <p className="text-green-400 font-semibold mb-4">⚡ You are now Shift Ready!</p>
            )}

            <Link
              href={`/passport/${user?.id}`}
              className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 font-semibold hover:opacity-90 transition"
            >
              View Your Passport →
            </Link>
          </div>
        )}

        {/* Failed result */}
        {result && !result.passed && (
          <div className="mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
            <div className="text-3xl mb-2">😅</div>
            <h2 className="text-xl font-bold mb-1">Almost there!</h2>
            <p className="text-white/70 mb-3">Score: {result.score}% · You need {assessment?.pass_score}% to pass</p>
            <button
              onClick={() => { setResult(null); setAnswers({}) }}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition font-medium"
            >
              Retry Assessment
            </button>
          </div>
        )}

        {/* Questions */}
        {!result && (
          <div className="space-y-6">
            {questions.map((q: any, qi: number) => (
              <div key={qi} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-violet-400 font-bold mt-0.5">Q{qi + 1}</span>
                  <p className="font-medium">{q.question}</p>
                </div>
                <div className="space-y-2">
                  {Object.entries(q.options as Record<string, string>).map(([key, text]) => (
                    <button
                      key={key}
                      onClick={() => setAnswers(a => ({ ...a, [String(qi)]: key }))}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                        answers[qi] === key
                          ? "bg-violet-500/30 border-violet-500 text-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      <span className="font-medium text-violet-400 mr-2">{key}.</span>
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={answered < questions.length || submitting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : `Submit Assessment (${answered}/${questions.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
