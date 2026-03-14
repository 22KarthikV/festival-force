"use client"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Zap, Bot, Gamepad2, CreditCard, BarChart3, Trophy, ArrowRight, Sparkles } from "lucide-react"

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

  const features = [
    {
      icon: Bot,
      title: "AI-Generated Training",
      desc: "Upload a PDF or Word doc. GPT-4o generates 3–5 role-specific modules with slides, quizzes, and a final assessment automatically.",
    },
    {
      icon: Gamepad2,
      title: "Gamified Learning",
      desc: "Volunteers earn XP, level up from Trainee to Festival Expert, and collect badges like Certified Bartender and Rush Hour Ready.",
    },
    {
      icon: CreditCard,
      title: "Shift-Ready Passport",
      desc: "Every certified volunteer gets a portable digital passport. Employers verify readiness at a glance — no paperwork, no delays.",
    },
    {
      icon: BarChart3,
      title: "Real-Time Dashboard",
      desc: "Track who's trained, who's certified, and who's available. Rush Mode highlights your top shift-ready volunteers instantly.",
    },
    {
      icon: Zap,
      title: "Rush Mode",
      desc: "Need staff in 10 minutes? Activate Rush Mode to surface your highest-scoring shift-ready volunteers ranked by readiness.",
    },
    {
      icon: Trophy,
      title: "Leaderboard",
      desc: "Friendly competition drives completion. Volunteers see their rank, XP, and badges compared to peers — boosting engagement.",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-display font-bold">FestivalForce</span>
          </div>
          <div className="flex gap-3">
            {user ? (
              <button
                onClick={handleDashboard}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 transition-colors duration-200 font-medium text-sm cursor-pointer"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 rounded-lg border border-white/15 hover:bg-white/10 hover:border-white/25 transition-all duration-200 text-sm text-white/80 hover:text-white">
                  Log in
                </Link>
                <Link href="/auth/register" className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 transition-opacity duration-200 font-medium text-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-6 pt-24 pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-8">
          <Zap className="w-3.5 h-3.5" />
          AI-powered training in minutes, not days
        </div>
        <h1 className="font-display text-6xl md:text-7xl font-extrabold mb-6 leading-[1.05] tracking-tight">
          Train Festival Workers<br />
          <span className="bg-gradient-to-r from-pink-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            10x Faster with AI
          </span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your staff handbook. AI generates role-specific training modules, quizzes, and
          assessments instantly. Volunteers earn badges and a portable Shift-Ready Passport.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/auth/register?role=employer"
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 font-bold text-base hover:opacity-90 transition-opacity duration-200 shadow-lg shadow-violet-500/25"
          >
            I&apos;m an Employer <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/register?role=volunteer"
            className="flex items-center gap-2 px-8 py-4 rounded-xl border border-white/15 hover:bg-white/5 hover:border-white/25 transition-all duration-200 font-semibold text-base"
          >
            I&apos;m a Volunteer
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/5 hover:border-white/15 transition-all duration-200 cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/25 transition-colors duration-200">
                  <Icon className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="font-display text-base font-bold mb-2">{f.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-white/10">
          <h2 className="font-display text-3xl font-bold mb-3">Ready for Edinburgh Fringe 2025?</h2>
          <p className="text-white/50 mb-8">Get your team trained and certified before the curtain rises.</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 font-bold text-base hover:opacity-90 transition-opacity duration-200"
          >
            Start Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="text-center py-8 text-white/30 text-sm border-t border-white/5">
        © 2025 FestivalForce · Built for Edinburgh Fringe Festival
      </footer>
    </div>
  )
}
