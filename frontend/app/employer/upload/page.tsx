"use client"
import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser, supabase } from "@/lib/supabase"
import { uploadDocument, createOrganization } from "@/lib/api"
import { Sparkles, ArrowLeft, Upload, FileText, CheckCircle2, XCircle, Loader2, Building2 } from "lucide-react"

interface UploadedDoc {
  id: string
  filename: string
  status: "uploading" | "processing" | "done" | "error"
}

export default function UploadPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [docs, setDocs] = useState<UploadedDoc[]>([])
  const [dragging, setDragging] = useState(false)
  const [orgName, setOrgName] = useState("")
  const [savingOrg, setSavingOrg] = useState(false)
  const [orgError, setOrgError] = useState("")

  useEffect(() => {
    getCurrentUser().then(u => {
      if (!u || u.role !== "employer") router.push("/auth/login")
      else setUser(u)
    })
  }, [router])

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orgName.trim() || !user) return
    setSavingOrg(true)
    setOrgError("")

    try {
      const result = await createOrganization({ name: orgName.trim(), user_id: user.id })
      setUser({ ...user, org_id: result.org_id })
    } catch (err: any) {
      setOrgError("Failed to create organisation: " + (err?.message || "Unknown error"))
    } finally {
      setSavingOrg(false)
    }
  }

  const handleFiles = useCallback(async (files: FileList) => {
    if (!user?.org_id) return
    const fileArr = Array.from(files)

    for (const file of fileArr) {
      const id = Math.random().toString(36).slice(2)
      setDocs(prev => [...prev, { id, filename: file.name, status: "uploading" }])

      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("org_id", user.org_id)

        await uploadDocument(formData)
        setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "done" } : d))
      } catch {
        setDocs(prev => prev.map(d => d.id === id ? { ...d, status: "error" } : d))
      }
    }
  }, [user])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  if (!user) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-base">FestivalForce</span>
          </Link>
          <Link
            href="/employer/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-all duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Upload Documents</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Upload your staff handbook, safety guides, or role-specific documents. AI will process them to generate training content.
          </p>
        </div>

        {/* Org name missing — ask for it first */}
        {!user.org_id && (
          <div className="mb-8 p-6 rounded-2xl bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-yellow-400" />
              <h2 className="font-display font-bold text-yellow-300">Set your organisation name first</h2>
            </div>
            <p className="text-white/50 text-sm mb-4">
              Your account doesn&apos;t have an organisation linked yet. Add one to enable document uploads and training generation.
            </p>
            <form onSubmit={handleCreateOrg} className="flex gap-3">
              <input
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. The Voodoo Rooms"
                className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-violet-400 transition-colors duration-200 text-sm"
                required
              />
              <button
                type="submit"
                disabled={savingOrg || !orgName.trim()}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500 hover:bg-violet-400 transition-colors duration-200 font-medium text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                {savingOrg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                {savingOrg ? "Saving..." : "Save Organisation"}
              </button>
            </form>
            {orgError && (
              <p className="mt-2 text-red-400 text-xs">{orgError}</p>
            )}
          </div>
        )}

        {/* Drop zone — only active when org exists */}
        <div
          onDrop={user.org_id ? onDrop : undefined}
          onDragOver={user.org_id ? onDragOver : undefined}
          onDragLeave={user.org_id ? onDragLeave : undefined}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
            !user.org_id
              ? "opacity-40 cursor-not-allowed border-white/10"
              : dragging
              ? "border-violet-400 bg-violet-500/10 cursor-copy"
              : "border-white/15 hover:border-white/30 hover:bg-white/5 cursor-pointer"
          }`}
          onClick={() => user.org_id && document.getElementById("file-input")?.click()}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-white/40" />
          </div>
          <p className="text-base font-medium mb-1">
            {!user.org_id ? "Set your organisation above to enable uploads" : "Drop files here or click to browse"}
          </p>
          <p className="text-white/40 text-sm">Supports PDF, DOCX, TXT</p>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={e => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Uploaded files */}
        {docs.length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="font-display text-base font-bold mb-4">Uploads</h2>
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  {doc.status === "uploading" ? (
                    <Loader2 className="w-5 h-5 text-yellow-400 animate-spin flex-shrink-0" />
                  ) : doc.status === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : doc.status === "error" ? (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-white/40 flex-shrink-0" />
                  )}
                  <span className="font-medium text-sm">{doc.filename}</span>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full ${
                  doc.status === "done" ? "bg-green-500/15 text-green-400 border border-green-500/20" :
                  doc.status === "error" ? "bg-red-500/15 text-red-400 border border-red-500/20" :
                  "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                }`}>
                  {doc.status === "uploading" ? "Uploading..." :
                   doc.status === "processing" ? "Processing..." :
                   doc.status === "done" ? "Processing Complete" : "Error"}
                </span>
              </div>
            ))}
          </div>
        )}

        {docs.some(d => d.status === "done") && (
          <div className="mt-8 p-5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-violet-400" />
              <p className="text-violet-300 font-medium text-sm">
                Documents processed! Head to your dashboard to generate training programs.
              </p>
            </div>
            <Link
              href="/employer/dashboard"
              className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 transition-colors duration-200 text-white font-medium text-sm"
            >
              Go to Dashboard <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
