"use client"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getCurrentUser } from "@/lib/supabase"
import { uploadDocument } from "@/lib/api"
import { useEffect } from "react"

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

  useEffect(() => {
    getCurrentUser().then(u => {
      if (!u || u.role !== "employer") router.push("/auth/login")
      else setUser(u)
    })
  }, [router])

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

  const statusIcon = (status: UploadedDoc["status"]) => {
    if (status === "uploading" || status === "processing") return "⏳"
    if (status === "done") return "✅"
    return "❌"
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
        <Link href="/employer/dashboard" className="flex items-center gap-2 text-xl font-bold">
          <span>🎪</span> FestivalForce
        </Link>
        <Link href="/employer/dashboard" className="text-white/60 hover:text-white text-sm">
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">Upload Documents</h1>
        <p className="text-white/60 mb-8">
          Upload your staff handbook, safety guides, or role-specific documents. AI will process them and use them to generate training content.
        </p>

        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition cursor-pointer ${
            dragging ? "border-violet-400 bg-violet-500/10" : "border-white/20 hover:border-white/40"
          }`}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <div className="text-5xl mb-4">📄</div>
          <p className="text-lg font-medium mb-1">Drop files here or click to browse</p>
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

        {/* Uploaded files list */}
        {docs.length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="text-lg font-semibold mb-4">Uploads</h2>
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{statusIcon(doc.status)}</span>
                  <span className="font-medium">{doc.filename}</span>
                </div>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  doc.status === "done" ? "bg-green-500/20 text-green-400" :
                  doc.status === "error" ? "bg-red-500/20 text-red-400" :
                  "bg-yellow-500/20 text-yellow-400"
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
          <div className="mt-8 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
            <p className="text-violet-300 font-medium">
              ✅ Documents processed! Head to your dashboard to generate training programs.
            </p>
            <Link href="/employer/dashboard" className="inline-block mt-3 px-6 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition">
              Go to Dashboard →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
