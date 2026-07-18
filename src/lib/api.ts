'use client'

export type PortfolioModule =
  | 'projects'
  | 'blog'
  | 'articles'
  | 'gallery'
  | 'experience'
  | 'skills'
  | 'services'
  | 'testimonials'
  | 'credentials'
  | 'profile'

export const portfolioModules: { key: PortfolioModule; label: string; description: string }[] = [
  { key: 'projects', label: 'Projects', description: 'Software builds, experiments, and case studies.' },
  { key: 'blog', label: 'Blog', description: 'Personal updates and engineering notes.' },
  { key: 'articles', label: 'Articles', description: 'Long-form technical and product writing.' },
  { key: 'gallery', label: 'Gallery', description: 'Images, screenshots, certificates, and visual proof.' },
  { key: 'experience', label: 'Journey', description: 'Professional Signal and Career Roadmap.' },
  { key: 'skills', label: 'Stack / Skills', description: 'Manage languages, tools, and technical skill groups.' },
  { key: 'services', label: 'Services', description: 'Offers, delivery packages, and hire-me positioning.' },
  { key: 'testimonials', label: 'Testimonials', description: 'Client proof, collaborator quotes, and trust signals.' },
  { key: 'credentials', label: 'Credentials', description: 'Certifications, awards, education, and proof of expertise.' },
  { key: 'profile', label: 'Profile Settings', description: 'Manage name, title, profile image, email and links.' },
]

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085/api'
const TOKEN_KEY = 'portfolio_admin_token'

export type ContentItem = {
  id: number
  module: PortfolioModule
  title: string
  slug: string
  summary: string
  body: string
  status: 'draft' | 'published' | 'archived'
  sort_order: number
  image_url: string
  external_url: string
  tags: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type ContentPayload = Omit<ContentItem, 'id' | 'module' | 'created_at' | 'updated_at'>

export type ContactMessage = {
  id: number
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'archived'
  created_at: string
  updated_at: string
}

export type DashboardCounts = {
  modules: Record<PortfolioModule, number>
  messages: { total: number; new: number }
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail || `Request failed with ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export async function loginAdmin(email: string, password: string) {
  const data = await apiFetch<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.access_token)
  return data
}

export type AnalyticsStats = {
  total_views: number
  unique_visitors: number
  device_stats: Record<string, number>
  browser_stats: Record<string, number>
  location_stats: Record<string, number>
  isp_stats: Record<string, number>
  referrer_stats: Record<string, number>
  path_stats: Record<string, number>
  views_over_time: { date: string; views: number }[]
}

export function getMe() {
  return apiFetch<{ id: number; email: string; name: string }>('/auth/me')
}

export function getDashboard() {
  return apiFetch<DashboardCounts>('/admin/dashboard')
}

export function getAnalyticsStats() {
  return apiFetch<AnalyticsStats>('/analytics/stats')
}

export function listContent(module: PortfolioModule) {
  return apiFetch<ContentItem[]>(`/admin/${module}`)
}

export function createContent(module: PortfolioModule, payload: ContentPayload) {
  return apiFetch<ContentItem>(`/admin/${module}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateContent(module: PortfolioModule, id: number, payload: Partial<ContentPayload>) {
  return apiFetch<ContentItem>(`/admin/${module}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteContent(module: PortfolioModule, id: number) {
  return apiFetch<void>(`/admin/${module}/${id}`, { method: 'DELETE' })
}

export function listMessages() {
  return apiFetch<ContactMessage[]>('/admin/contact/messages')
}

export function updateMessage(id: number, status: ContactMessage['status']) {
  return apiFetch<ContactMessage>(`/admin/contact/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function deleteMessage(id: number) {
  return apiFetch<void>(`/admin/contact/messages/${id}`, { method: 'DELETE' })
}

export async function uploadFile(file: File): Promise<{ url: string; filename: string }> {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const backendBase = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : ''

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail || `Upload failed with ${response.status}`)
  }

  const data = await response.json()
  return {
    ...data,
    url: data.url.startsWith('/') ? `${backendBase}${data.url}` : data.url
  }
}

export async function uploadCV(file: File): Promise<{ url: string; filename: string }> {
  const token = getToken()
  const formData = new FormData()
  formData.append('file', file)

  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const backendBase = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : ''

  const response = await fetch(`${API_BASE}/upload/cv`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.detail || `CV upload failed with ${response.status}`)
  }

  const data = await response.json()
  return {
    ...data,
    url: data.url.startsWith('/') ? `${backendBase}${data.url}` : data.url
  }
}

export async function getCVStatus(): Promise<{ exists: boolean; url: string | null }> {
  const token = getToken()
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  
  const backendBase = API_BASE.endsWith('/api') ? API_BASE.slice(0, -4) : ''
  const response = await fetch(`${API_BASE}/upload/cv`, { headers })
  if (!response.ok) return { exists: false, url: null }
  const data = await response.json()
  return {
    ...data,
    url: data.url && data.url.startsWith('/') ? `${backendBase}${data.url}` : data.url
  }
}
