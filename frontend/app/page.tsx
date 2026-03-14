"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LandingPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleDashboard = () => {
    supabase.from("users").select("role").eq("id", user.id).single().then(({ data }) => {
      router.push(data?.role === "employer" ? "/employer/dashboard" : "/training")
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎪</span>
          <span className="text-xl font-bold">FestivalForce</span>
        </div>
        <div className="flex gap-4">
          {user ? (
            <button onClick={handleDashboard} className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 transition font-medium">
              Go to Dashboard →
            </button>
          ) : (
            <>
              <Link href="/auth/login" className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition">
                Log in
              </Link>
              <Link href="/auth/register" className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 transition font-medium">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm mb-6">
          <span>⚡</span>
          <span>AI-powered training in minutes, not days</span>
        </div>
        <h1 className="text-6xl font-extrabold mb-6 leading-tight">
          Train Festival Workers<br />
          <span className="bg-gradient-to-r from-pink-400 to-yellow-400 bg-clip-text text-transparent">
            10x Faster with AI
          </span>
        </h1>
        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
          Upload your staff handbook. AI generates role-specific training modules, quizzes, and
          assessments instantly. Volunteers earn badges and a portable Shift-Ready Passport.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/register?role=employer" className="px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 font-bold text-lg hover:opacity-90 transition">
            I&apos;m an Employer →
          </Link>
          <Link href="/auth/register?role=volunteer" className="px-8 py-4 rounded-xl border border-white/20 hover:bg-white/10 transition font-semibold text-lg">
            I&apos;m a Volunteer
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🤖",
              title: "AI-Generated Training",
              desc: "Upload a PDF or Word doc. GPT-4o generates 3–5 role-specific modules with slides, quizzes, and a final assessment automatically.",
            },
            {
              icon: "🎮",
              title: "Gamified Learning",
              desc: "Volunteers earn XP, level up from Trainee to Festival Expert, and collect badges like 🍸 Certified Bartender and ⚡ Rush Hour Ready.",
            },
            {
              icon: "🪪",
              title: "Shift-Ready Passport",
              desc: "Every certified volunteer gets a portable digital passport. Employers verify readiness at a glance — no paperwork, no delays.",
            },
            {
              icon: "📊",
              title: "Real-Time Dashboard",
              desc: "Track who's trained, who's certified, and who's available. Rush Mode highlights your top shift-ready volunteers instantly.",
            },
            {
              icon: "⚡",
              title: "Rush Mode",
              desc: "Need staff in 10 minutes? Activate Rush Mode to surface your highest-scoring shift-ready volunteers ranked by readiness.",
            },
            {
              icon: "🏆",
              title: "Leaderboard",
              desc: "Friendly competition drives completion. Volunteers see their rank, XP, and badges compared to peers — boosting engagement.",
            },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-8 pb-24 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-pink-500/20 to-violet-500/20 border border-white/10">
          <h2 className="text-3xl font-bold mb-4">Ready for Edinburgh Fringe 2025?</h2>
          <p className="text-white/60 mb-6">Get your team trained and certified before the curtain rises.</p>
          <Link href="/auth/register" className="inline-block px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 font-bold text-lg hover:opacity-90 transition">
            Start Free →
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-white/40 text-sm">
        © 2025 FestivalForce · Built for Edinburgh Fringe Festival
      </footer>
    </div>
  )
}
