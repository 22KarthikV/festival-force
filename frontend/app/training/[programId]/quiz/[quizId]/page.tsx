"use client"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/supabase"
import { getQuiz, submitQuiz } from "@/lib/api"

export default function QuizPage() {
  const { programId, quizId } = useParams<{ programId: string; quizId: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [quiz, setQuiz] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isRetry, setIsRetry] = useState(false)

  useEffect(() => {
    getCurrentUser().then(async u => {
      if (!u) { router.push("/auth/login"); return }
      setUser(u)
      const q = await getQuiz(quizId)
      setQuiz(q)
      setLoading(false)
    })
  }, [quizId, router])

  const handleSubmit = async () => {
    if (!user || Object.keys(answers).length < quiz.questions.length) return
    setSubmitting(true)
    const res = await submitQuiz(quizId, { user_id: user.id, answers, is_retry: isRetry })
    setResult(res)
    setSubmitting(false)
  }

  const handleRetry = () => {
    setAnswers({})
    setResult(null)
    setIsRetry(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-white animate-pulse">Loading quiz...</div>
    </div>
  )

  const questions: any[] = quiz?.questions || []
  const answered = Object.keys(answers).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href={`/training/${programId}`} className="text-white/60 hover:text-white text-sm">
          ← Back to program
        </Link>
        <p className="text-white/50 text-sm">{answered}/{questions.length} answered</p>
      </nav>

      <div className="max-w-2xl mx-auto px-8 py-10">
        <div className="mb-8">
          <p className="text-violet-400 text-sm font-medium mb-1">Knowledge Check</p>
          <h1 className="text-2xl font-bold">Module Quiz</h1>
          <p className="text-white/50 text-sm mt-1">Score 70% or higher to pass and earn XP</p>
        </div>

        {/* Result modal */}
        {result && (
          <div className={`mb-8 p-6 rounded-2xl border ${result.passed ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
            <div className="text-4xl mb-2">{result.passed ? "🎉" : "😅"}</div>
            <h2 className="text-xl font-bold mb-1">
              {result.passed ? "You Passed!" : "Not quite — try again"}
            </h2>
            <p className="text-white/70 mb-2">
              Score: {result.score}% · {result.correct_answers}/{result.total_questions} correct
            </p>
            {result.passed && (
              <p className="text-yellow-400 font-medium">+{result.xp_awarded} XP earned!</p>
            )}
            <div className="flex gap-3 mt-4">
              {result.passed ? (
                <Link
                  href={`/training/${programId}`}
                  className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-400 transition font-medium"
                >
                  Continue Training →
                </Link>
              ) : (
                <button
                  onClick={handleRetry}
                  className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition font-medium"
                >
                  Retry Quiz
                </button>
              )}
            </div>
          </div>
        )}

        {/* Questions */}
        {!result && (
          <div className="space-y-6">
            {questions.map((q: any, qi: number) => (
              <div key={qi} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <p className="font-medium mb-4">
                  <span className="text-violet-400 mr-2">Q{qi + 1}.</span>
                  {q.question}
                </p>
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 font-semibold text-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? "Submitting..." : `Submit Quiz (${answered}/${questions.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
