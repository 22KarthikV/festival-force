"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { getEmployerDashboard, generateTraining, activateRushMode } from "@/lib/api"

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
      <div className="text-white text-xl animate-pulse">Loading dashboard...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span>🎪</span> FestivalForce
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/employer/upload" className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 transition text-sm font-medium">
            + Upload Docs
          </Link>
          <button onClick={handleSignOut} className="text-white/60 hover:text-white text-sm">Sign out</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Employer Dashboard</h1>
          <p className="text-white/60 mt-1">Manage training and track volunteer readiness</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Volunteers", value: dashboard?.total_volunteers ?? 0, icon: "👥" },
            { label: "Shift Ready", value: dashboard?.shift_ready_count ?? 0, icon: "✅" },
            { label: "Avg Completion", value: `${dashboard?.avg_completion_rate ?? 0}%`, icon: "📈" },
            { label: "Active Programs", value: dashboard?.active_programs ?? 0, icon: "📚" },
          ].map(stat => (
            <div key={stat.label} className="p-5 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-white/50 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Generate training */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-lg font-bold mb-4">Generate Training Program</h2>
            <p className="text-white/50 text-sm mb-4">
              Enter a role name and AI will generate tailored training using your uploaded documents.
            </p>
            <div className="flex gap-3">
              <input
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="e.g. Bartender, Usher, Ticket Desk..."
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-violet-400"
                onKeyDown={e => e.key === "Enter" && handleGenerateTraining()}
              />
              <button
                onClick={handleGenerateTraining}
                disabled={generating || !newRole.trim()}
                className="px-5 py-3 rounded-lg bg-gradient-to-r from-pink-500 to-violet-500 font-medium hover:opacity-90 transition disabled:opacity-50"
              >
                {generating ? "..." : "Generate"}
              </button>
            </div>
            {generateStatus && (
              <p className="mt-3 text-sm text-violet-300 animate-pulse">{generateStatus}</p>
            )}
          </div>

          {/* Rush Mode */}
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-lg font-bold mb-2">⚡ Rush Mode</h2>
            <p className="text-white/50 text-sm mb-4">
              Need staff right now? Find your top shift-ready volunteers instantly.
            </p>
            <button
              onClick={handleRushMode}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 font-medium hover:opacity-90 transition"
            >
              Activate Rush Mode
            </button>
            {rushMode && (
              <div className="mt-4">
                <p className="text-sm text-yellow-400 font-medium mb-2">
                  {rushMode.total_shift_ready} volunteers shift-ready
                </p>
                <div className="space-y-2">
                  {rushMode.top_volunteers.slice(0, 5).map((v: any, i: number) => (
                    <div key={v.user_id} className="flex items-center justify-between text-sm">
                      <span className="text-white/70">#{i + 1} {v.full_name}</span>
                      <span className="text-green-400">{v.avg_score}% score</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Volunteer table */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-lg font-bold mb-4">Volunteer Progress</h2>
          {!dashboard?.volunteers?.length ? (
            <p className="text-white/40 text-sm">No volunteers enrolled yet. Share your training program links with staff.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/50">
                    <th className="text-left py-3 pr-4">Name</th>
                    <th className="text-left py-3 pr-4">Level</th>
                    <th className="text-left py-3 pr-4">XP</th>
                    <th className="text-left py-3 pr-4">Completion</th>
                    <th className="text-left py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.volunteers.map((v: any) => (
                    <tr key={v.id} className="border-b border-white/5">
                      <td className="py-3 pr-4 font-medium">{v.full_name || v.email}</td>
                      <td className="py-3 pr-4 text-white/70">{v.level_title}</td>
                      <td className="py-3 pr-4 text-yellow-400">{v.xp} XP</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${v.completion_rate}%` }}
                            />
                          </div>
                          <span className="text-white/60">{v.completion_rate}%</span>
                        </div>
                      </td>
                      <td className="py-3">
                        {v.shift_ready ? (
                          <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">Shift Ready ✅</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">In Training</span>
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
          <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-lg font-bold mb-4">Training Programs</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {dashboard.programs.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/employer/training/${p.id}`}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition"
                >
                  <div className="font-medium">{p.title}</div>
                  <div className="text-white/50 text-sm mt-1">View program →</div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
