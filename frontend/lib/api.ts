const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  return res.json()
}

// Documents
export const uploadDocument = async (formData: FormData) => {
  const res = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const getOrgDocuments = (orgId: string) =>
  request(`/api/documents/org/${orgId}`)

// Training
export const generateTraining = (body: { role_id: string; org_id: string; role_name: string }) =>
  request("/api/training/generate/sync", { method: "POST", body: JSON.stringify(body) })

export const getTrainingProgram = (programId: string) =>
  request(`/api/training/${programId}`)

export const listModules = (programId: string) =>
  request(`/api/training/${programId}/modules`)

export const getModule = (moduleId: string) =>
  request(`/api/modules/${moduleId}`)

export const getModuleQuiz = (moduleId: string) =>
  request(`/api/modules/${moduleId}/quiz`)

export const getQuiz = (quizId: string) =>
  request(`/api/quizzes/${quizId}`)

export const submitQuiz = (quizId: string, body: { user_id: string; answers: Record<string, string>; is_retry?: boolean }) =>
  request(`/api/quizzes/${quizId}/submit`, { method: "POST", body: JSON.stringify(body) })

export const getProgramAssessment = (programId: string) =>
  request(`/api/training/${programId}/assessment`)

export const getAssessment = (assessmentId: string) =>
  request(`/api/assessments/${assessmentId}`)

export const submitAssessment = (assessmentId: string, body: { user_id: string; program_id: string; answers: Record<string, string> }) =>
  request(`/api/assessments/${assessmentId}/submit`, { method: "POST", body: JSON.stringify(body) })

// Progress
export const getProgress = (userId: string, programId: string) =>
  request(`/api/progress/${userId}/${programId}`)

// Passport
export const getPassport = (userId: string) =>
  request(`/api/passport/${userId}`)

// Dashboard
export const getEmployerDashboard = (orgId: string) =>
  request(`/api/dashboard/employer/${orgId}`)

export const getLeaderboard = (orgId: string) =>
  request(`/api/leaderboard/${orgId}`)

export const activateRushMode = (orgId: string) =>
  request(`/api/rush-mode/${orgId}/activate`, { method: "POST" })
