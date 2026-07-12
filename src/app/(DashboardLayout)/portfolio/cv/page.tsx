'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { uploadCV, getCVStatus } from '@/lib/api'

export default function CVPage() {
  const [cvInfo, setCvInfo] = useState<{ exists: boolean; url: string | null }>({ exists: false, url: null })
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadCVStatus() {
    try {
      const status = await getCVStatus()
      setCvInfo(status)
    } catch (err) {
      console.error('Failed to load CV status:', err)
    }
  }

  useEffect(() => {
    loadCVStatus()
  }, [])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed.')
      setSuccess('')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const data = await uploadCV(file)
      setCvInfo({ exists: true, url: data.url })
      setSuccess('CV uploaded successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CV.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-dark dark:text-white">Curriculum Vitae</h1>
        <p className="text-sm text-link">
          Manage your professional CV PDF file. The uploaded CV is hosted statically and can be linked directly on your public portfolio page.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 border-ld">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Upload CV File</CardTitle>
            <CardDescription className="text-xs">
              Upload a new version of your PDF CV. This will overwrite any previously uploaded CV file immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-md border border-red-200 dark:border-red-900/50">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-xs rounded-md border border-green-200 dark:border-green-900/50">
                {success}
              </div>
            )}

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-ld rounded-md p-6 bg-slate-50/50 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-all">
              <span className="text-3xl mb-2">📄</span>
              <span className="text-xs font-medium text-ld mb-1">Click to select PDF file</span>
              <span className="text-[10px] text-link mb-4">Max size: 10MB</span>
              
              <label className="w-full">
                <Button asChild variant="outline" className="w-full cursor-pointer text-xs border-ld" disabled={uploading}>
                  <span>{uploading ? 'Uploading...' : 'Choose PDF File'}</span>
                </Button>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>

            {cvInfo.exists && cvInfo.url && (
              <div className="pt-2">
                <a
                  href={cvInfo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full justify-center items-center px-4 py-2 border border-primary text-xs font-semibold rounded-md text-primary hover:bg-lightprimary transition-colors"
                >
                  View current CV PDF
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-ld h-[550px] flex flex-col">
          <CardHeader className="border-b border-ld pb-4">
            <CardTitle className="text-lg font-semibold">Live Preview</CardTitle>
            <CardDescription className="text-xs">Preview how your CV looks to recruiters and visitors.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            {cvInfo.exists && cvInfo.url ? (
              <iframe
                src={`${cvInfo.url}#toolbar=0`}
                className="w-full h-full border-0"
                title="CV PDF Preview"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-link p-6 text-center">
                <span className="text-4xl mb-3">📁</span>
                <p className="font-semibold text-ld">No CV file uploaded yet</p>
                <p className="text-xs max-w-xs mt-1">Upload your curriculum vitae PDF on the left panel to display the live preview here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
