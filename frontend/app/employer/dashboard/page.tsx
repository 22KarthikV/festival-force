"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { getEmployerDashboard, generateTraining, activateRushMode } from "@/lib/api"
import {
  Sparkles, Users, ShieldCheck, TrendingUp, BookOpen,
  Zap, ArrowRight, LogOut, Upload, Loader2, Plus
} from "lucide-react"

export default function EmployerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [rushMode, setRushMode] = useState<any>(null)
  const [newRole, setNewRole] = useState("")
  const [generateStatus, setGenerateStatus] = useState("")

  useEffect(() => {
    getCurrentUser().then(u => {
      if (!u || u.role !== "employer") { router.push("/auth/login"); return }
      setUser(u)
      if (!u.org_id) {
        // org_id not set yet — show empty dashboard
        setDashboard({ total_volunteers: 0, shift_ready_count: 0, avg_completion_rate: 0, active_programs: 0, volunteers: [], programs: [] })
        setLoading(false)
        return
      }
      getEmployerDashboard(u.org_id).then(d => { setDashboard(d); setLoading(false) })
    })
  }, [router])

  const handleGenerateTraining = async () => {
    if (!newRole.trim() || !user?.org_id) return
    setGenerating(true)
    setGenerateStatus("Creating role...")

    try {
      const { data: roleData } = await supabase.from("roles").insert({
        org_id: user.org_id,
        name: newRole,
      }).select().single()

      setGenerateStatus("Generating AI training modules...")
      await generateTraining({ role_id: roleData.id, org_id: user.org_id, role_name: newRole })

      setGenerateStatus("Done! Refreshing...")
      const d = await getEmployerDashboard(user.org_id)
      setDashboard(d)
      setNewRole("")
      setGenerateStatus("")
    } catch (e) {
      setGenerateStatus("Error: " + (e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const handleRushMode = async () => {
    if (!user?.org_id) return
    const result = await activateRushMode(user.org_id)
    setRushMode(result)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/60">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span>Loading dashboard...</span>
      </div>
    </div>
  )

  const stats = [
    { label: "Total Volunteers", value: dashboard?.total_volunteers ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Shift Ready", value: dashboard?.shift_ready_count ?? 0, icon: ShieldCheck, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: "Avg Completion", value: `${dashboard?.avg_completion_rate ?? 0}%`, icon: TrendingUp, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    { label: "Active Programs", value: dashboard?.active_programs ?? 0, icon: BookOpen, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-96 h-96 bg-pink-600/8 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-base">FestivalForce</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/employer/upload"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 transition-colors duration-200 text-sm font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Docs
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 text-sm transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="relative max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-white/50 text-sm mt-1">Manage training and track volunteer readiness</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className={`p-5 rounded-2xl border ${stat.bg}`}>
                <div className={`w-9 h-9 rounded-xl ${stat.bg} border flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-white/50 text-xs mt-1">{stat.label}</div>
              </div>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Generate training */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="font-display text-base font-bold mb-1">Generate Training Program</h2>
            <p className="text-white/45 text-sm mb-5">
              Enter a role name and AI will generate tailored training using your uploaded documents.
            </p>
            <div className="flex gap-3">
              <input
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="e.g. Bartender, Usher, Ticket Desk..."
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 transition-colors duration-200 text-sm"
                onKeyDown={e => e.key === "Enter" && handleGenerateTraining()}
              />
              <button
                onClick={handleGenerateTraining}
                disabled={generating || !newRole.trim()}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-500 font-medium hover:opacity-90 transition-opacity duration-200 disabled:opacity-50 text-sm cursor-pointer whitespace-nowrap"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
            {generateStatus && (
              <div className="mt-3 flex items-center gap-2 text-sm text-violet-300">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {generateStatus}
              </div>
            )}
          </div>

          {/* Rush Mode */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-yellow-400" />
              <h2 className="font-display text-base font-bold">Rush Mode</h2>
            </div>
            <p className="text-white/45 text-sm mb-5">
              Need staff right now? Find your top shift-ready volunteers instantly.
            </p>
            <button
              onClick={handleRushMode}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 font-medium hover:opacity-90 transition-opacity duration-200 text-sm cursor-pointer shadow-lg shadow-orange-500/20"
            >
              <Zap className="w-4 h-4" />
              Activate Rush Mode
            </button>
            {rushMode && (
              <div className="mt-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/15">
                <p className="text-yellow-400 font-medium text-sm mb-3">
                  {rushMode.total_shift_ready} volunteers shift-ready
                </p>
                <div className="space-y-2">
                  {rushMode.top_volunteers.slice(0, 5).map((v: any, i: number) => (
                    <div key={v.user_id} className="flex items-center justify-between text-xs">
                      <span className="text-white/60">#{i + 1} {v.full_name}</span>
                      <span className="text-green-400 font-medium">{v.avg_score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Volunteer table */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <h2 className="font-display text-base font-bold mb-5">Volunteer Progress</h2>
          {!dashboard?.volunteers?.length ? (
            <div className="py-10 text-center">
              <Users className="w-8 h-8 text-white/15 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No volunteers enrolled yet.</p>
              <p className="text-white/25 text-xs mt-1">Share your training program links with staff.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 pr-4 text-white/40 text-xs font-medium uppercase tracking-wide">Name</th>
                    <th className="text-left py-3 pr-4 text-white/40 text-xs font-medium uppercase tracking-wide">Level</th>
                    <th className="text-left py-3 pr-4 text-white/40 text-xs font-medium uppercase tracking-wide">XP</th>
                    <th className="text-left py-3 pr-4 text-white/40 text-xs font-medium uppercase tracking-wide">Completion</th>
                    <th className="text-left py-3 text-white/40 text-xs font-medium uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.volunteers.map((v: any) => (
                    <tr key={v.id} className="border-b border-white/4 hover:bg-white/5 transition-colors duration-150">
                      <td className="py-3.5 pr-4 font-medium text-sm">{v.full_name || v.email}</td>
                      <td className="py-3.5 pr-4 text-white/60 text-sm">{v.level_title}</td>
                      <td className="py-3.5 pr-4 text-yellow-400 font-semibold text-sm">{v.xp} XP</td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full transition-all duration-700"
                              style={{ width: `${v.completion_rate}%` }}
                            />
                          </div>
                          <span className="text-white/50 text-xs">{v.completion_rate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5">
                        {v.shift_ready ? (
                          <span className="flex items-center gap-1 w-fit px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                            <ShieldCheck className="w-3 h-3" />
                            Shift Ready
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
                            In Training
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Programs */}
        {dashboard?.programs?.length > 0 && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="font-display text-base font-bold mb-4">Training Programs</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {dashboard.programs.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/employer/training/${p.id}`}
                  className="group flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/35 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="font-medium text-sm">{p.title}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-white/25 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all duration-200" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
