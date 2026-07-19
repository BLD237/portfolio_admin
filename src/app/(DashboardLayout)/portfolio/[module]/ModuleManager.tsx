'use client'

import { FormEvent, useEffect, useMemo, useState, useRef } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'
import {
  ContactMessage,
  ContentItem,
  ContentPayload,
  PortfolioModule,
  createContent,
  deleteContent,
  deleteMessage,
  listContent,
  listMessages,
  portfolioModules,
  updateContent,
  updateMessage,
  uploadFile,
} from '@/lib/api'

const emptyForm: ContentPayload = {
  title: '',
  slug: '',
  summary: '',
  body: '',
  status: 'published',
  sort_order: 0,
  image_url: '',
  external_url: '',
  tags: [],
  metadata: {},
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-50/50 dark:bg-slate-900/50 border border-ld animate-pulse rounded-md flex items-center justify-center text-sm text-link">Loading rich text editor...</div>
})

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}

function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="w-full bg-white dark:bg-slate-900/40 rounded-md border border-ld overflow-hidden quill-editor-wrapper">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'Start writing...'}
        modules={{
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ]
        }}
        className="text-ld"
      />
    </div>
  )
}

export default function ModuleManager({ module }: { module: PortfolioModule | 'contact' }) {
  if (module === 'contact') {
    return (
      <div className='space-y-10'>
        <ContactManager />
      </div>
    )
  }
  return <ContentManager module={module} />
}

function ContentManager({ module }: { module: PortfolioModule }) {
  const moduleMeta = useMemo(() => portfolioModules.find((item) => item.key === module), [module])
  const [items, setItems] = useState<ContentItem[]>([])
  const [selected, setSelected] = useState<ContentItem | null>(null)
  const [form, setForm] = useState<ContentPayload>(emptyForm)
  const [tagText, setTagText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const rows = await listContent(module)
      setItems(rows)
      if (module === 'profile') {
        const mainItem = rows.find((r) => r.slug === 'main')
        if (mainItem) {
          edit(mainItem)
        } else if (rows.length > 0) {
          edit(rows[0])
        } else {
          // Prefill settings form for first profile item
          setSelected(null)
          setForm({
            title: 'Mufor Belmond Piannow',
            slug: 'main',
            summary: 'Software Engineer and Data Scientist',
            body: 'I build software, data systems, AI workflows, backend APIs, and mobile products from Cameroon with a practical, product-focused engineering style.',
            status: 'published',
            sort_order: 1,
            image_url: 'https://avatars.githubusercontent.com/u/161585619?v=4',
            external_url: 'info@muforbelmond.tech',
            tags: [],
            metadata: {
              company: 'SKYE8',
              location: 'Cameroon',
              linkedin: 'https://www.linkedin.com/in/mufor-belmond-a631082b8/',
              github: 'https://github.com/BLD237'
            }
          })
          setIsFormOpen(true)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setSelected(null)
    setForm(emptyForm)
    setTagText('')
    setIsFormOpen(false)
    setSaveSuccess(false)
    load()
  }, [module])

  function edit(item: ContentItem) {
    setSelected(item)
    setForm({
      title: item.title,
      slug: item.slug,
      summary: item.summary,
      body: item.body,
      status: item.status,
      sort_order: item.sort_order,
      image_url: item.image_url,
      external_url: item.external_url,
      tags: item.tags,
      metadata: item.metadata || {},
    })
    setTagText(item.tags.join(', '))
    setIsFormOpen(true)
  }

  function resetForm() {
    setSelected(null)
    setForm(emptyForm)
    setTagText('')
    setIsFormOpen(false)
    setSaveSuccess(false)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSaveSuccess(false)
    const payload = {
      ...form,
      slug: form.slug || (module === 'profile' ? 'main' : slugify(form.title)),
      sort_order: Number(form.sort_order) || 0,
      tags: module === 'profile' ? [] : tagText.split(',').map((tag) => tag.trim()).filter(Boolean),
    }

    try {
      if (selected) {
        const result = await updateContent(module, selected.id, payload)
        // Keep updated item selected
        setSelected(result as any)
      } else {
        const result = await createContent(module, payload)
        setSelected(result as any)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      if (module !== 'profile') {
        resetForm()
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save content')
    } finally {
      setSaving(false)
    }
  }

  async function remove(item: ContentItem) {
    if (!confirm(`Delete "${item.title}"?`)) return
    await deleteContent(module, item.id)
    if (selected?.id === item.id) resetForm()
    await load()
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <p className='text-sm font-semibold uppercase tracking-wide text-primary'>{moduleMeta?.label}</p>
          <h1 className='text-3xl font-bold text-ld'>Manage {moduleMeta?.label}</h1>
          <p className='mt-2 text-sm text-link'>{moduleMeta?.description}</p>
        </div>
      </div>

      {error ? <div className='rounded-sm bg-lighterror p-4 text-sm text-error'>{error}</div> : null}

      {!isFormOpen ? (
        <Card className="border-ld">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-ld">
            <div>
              <CardTitle className="text-xl font-bold">All Entries</CardTitle>
              <CardDescription className="text-sm mt-1">
                {loading ? 'Loading content...' : `Showing ${items.length} records in this module.`}
              </CardDescription>
            </div>
            <Button onClick={() => { resetForm(); setIsFormOpen(true); }} size="sm" className="bg-primary text-white hover:bg-primary/95 shrink-0">
              Create New Entry
            </Button>
          </CardHeader>
          <CardContent className='pt-6 space-y-4'>
            {items.map((item) => (
              <div key={item.id} className='rounded-md border border-ld p-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors'>
                <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <h2 className='font-semibold text-ld text-base'>
                        {module === 'experience'
                          ? `${item.title} at ${item.slug.toUpperCase() === 'SKYE8' ? 'SKYE8' : item.slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`
                          : item.title}
                      </h2>
                      <Badge variant={item.status === 'published' ? 'lightSuccess' : 'gray'}>{item.status}</Badge>
                    </div>
                    <p className='mt-2 text-sm text-link line-clamp-2'>
                      {module === 'experience'
                        ? `Period: ${item.summary}`
                        : module === 'skills'
                          ? `Skills: ${item.tags.join(', ')}`
                          : item.summary || item.body}
                    </p>
                    {module !== 'experience' && module !== 'skills' && <p className='mt-2 text-xs text-charcoal'>Slug: /{item.slug}</p>}
                  </div>
                  <div className='flex shrink-0 gap-2 items-center'>
                    <Button type='button' variant='outline' size='sm' onClick={() => edit(item)} className="border-ld">Edit</Button>
                    <Button type='button' variant='lighterror' size='sm' onClick={() => remove(item)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
            {!items.length && !loading ? (
              <div className="text-center py-8">
                <p className='text-sm text-link'>No records found. Click "Create New Entry" to get started.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-4xl mx-auto border-ld">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-ld">
            <div>
              <CardTitle className="text-xl font-bold">
                {module === 'profile' ? 'Edit Profile Settings' : selected ? 'Edit Entry' : 'Create New Entry'}
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {module === 'profile'
                  ? 'Manage your public portfolio identity, profile picture, and connectivity links.'
                  : 'Configure all fields below. Content will be synced immediately.'}
              </CardDescription>
            </div>
            {module !== 'profile' && (
              <Button variant="outline" size="sm" onClick={resetForm} className="border-ld hover:bg-lightprimary">
                Cancel & Back
              </Button>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {saveSuccess && (
              <div className="mb-6 rounded-sm bg-lightsuccess p-4 text-sm text-success font-semibold">
                Changes saved successfully! Your public portfolio is synchronized.
              </div>
            )}
            <form className='space-y-6' onSubmit={submit}>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor='title'>
                    {module === 'profile' ? 'Full Name' : module === 'experience' ? 'Role' : module === 'skills' ? 'Category (e.g. Languages)' : 'Title'}
                  </Label>
                  <Input
                    id='title'
                    className="mt-2"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                        slug: current.slug || (module === 'profile' ? 'main' : slugify(event.target.value)),
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor='slug'>
                    {module === 'profile' ? 'Profile Slug (Read Only)' : module === 'experience' ? 'Company (e.g. SKYE8)' : module === 'skills' ? 'Category Slug' : 'Slug'}
                  </Label>
                  <Input
                    id='slug'
                    className="mt-2"
                    value={form.slug}
                    disabled={module === 'profile'}
                    onChange={(event) => setForm((current) => ({ ...current, slug: slugify(event.target.value) }))}
                    required
                  />
                </div>
              </div>

              {module !== 'skills' && (
                <div>
                  <Label htmlFor='summary'>
                    {module === 'profile' ? 'Job Title' : module === 'experience' ? 'Period (e.g. 2024 - Present)' : 'Summary / Intro Text'}
                  </Label>
                  {module === 'profile' ? (
                    <Input
                      id='summary'
                      className="mt-2"
                      value={form.summary}
                      onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                      required
                    />
                  ) : (
                    <Textarea
                      id='summary'
                      className="mt-2 min-h-20"
                      value={form.summary}
                      onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                    />
                  )}
                </div>
              )}

              {module !== 'skills' && (
                <div>
                  <Label htmlFor='body' className="font-semibold text-sm block mb-2">
                    {module === 'profile' ? 'Biography Summary' : module === 'experience' ? 'Points (One per line)' : 'Content Body'}
                  </Label>
                  {module === 'experience' ? (
                    <Textarea
                      id='body'
                      className='w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-2 min-h-36 font-sans'
                      value={form.body}
                      onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                      placeholder='Enter points here, one per line...'
                    />
                  ) : module === 'profile' ? (
                    <Textarea
                      id='body'
                      className='w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-2 min-h-32 font-sans'
                      value={form.body}
                      onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                      placeholder='Write a short description bio about yourself...'
                      required
                    />
                  ) : (
                    <div className="mt-2">
                      <RichTextEditor
                        value={form.body}
                        onChange={(val) => setForm((current) => ({ ...current, body: val }))}
                        placeholder='Write your post/article/project description here...'
                      />
                    </div>
                  )}
                </div>
              )}

              {module !== 'profile' && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor='status'>Status</Label>
                    <select
                      id='status'
                      className='mt-2 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, status: event.target.value as ContentPayload['status'] }))
                      }
                    >
                      <option value='published'>Published</option>
                      <option value='draft'>Draft</option>
                      <option value='archived'>Archived</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor='order'>Sort order</Label>
                    <Input
                      id='order'
                      className="mt-2"
                      type='number'
                      value={form.sort_order}
                      onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))}
                    />
                  </div>
                </div>
              )}

              {module !== 'skills' && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <Label htmlFor='image'>{module === 'profile' ? 'Profile Picture' : 'Image URL'}</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id='image'
                        className="flex-1"
                        value={form.image_url}
                        onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))}
                        placeholder="Paste link or upload..."
                      />
                      <label className="flex items-center justify-center px-4 py-2 border border-ld rounded-md bg-slate-50 dark:bg-slate-900 text-xs font-semibold cursor-pointer hover:bg-lightprimary shrink-0 transition-colors">
                        {uploadingImage ? 'Uploading...' : 'Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingImage}
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setUploadingImage(true)
                            try {
                              const data = await uploadFile(file)
                              setForm((current) => ({ ...current, image_url: data.url }))
                            } catch (err) {
                              alert(err instanceof Error ? err.message : 'Upload failed')
                            } finally {
                              setUploadingImage(false)
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor='external'>{module === 'profile' ? 'Contact Email' : 'External URL'}</Label>
                    <Input
                      id='external'
                      className="mt-2"
                      value={form.external_url}
                      onChange={(event) => setForm((current) => ({ ...current, external_url: event.target.value }))}
                      required={module === 'profile'}
                    />
                  </div>
                </div>
              )}

              {module === 'profile' && (
                <div className="border-t border-ld pt-6 space-y-6">
                  <h3 className="text-lg font-bold text-ld">Links & Metadata</h3>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <Label htmlFor='meta_company'>Company</Label>
                      <Input
                        id='meta_company'
                        className="mt-2"
                        value={(form.metadata?.company as string) || ''}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            metadata: { ...(current.metadata || {}), company: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor='meta_location'>Location</Label>
                      <Input
                        id='meta_location'
                        className="mt-2"
                        value={(form.metadata?.location as string) || ''}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            metadata: { ...(current.metadata || {}), location: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor='meta_linkedin'>LinkedIn Profile</Label>
                      <Input
                        id='meta_linkedin'
                        className="mt-2"
                        value={(form.metadata?.linkedin as string) || ''}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            metadata: { ...(current.metadata || {}), linkedin: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor='meta_github'>GitHub Profile</Label>
                      <Input
                        id='meta_github'
                        className="mt-2"
                        value={(form.metadata?.github as string) || ''}
                        onChange={(e) =>
                          setForm((current) => ({
                            ...current,
                            metadata: { ...(current.metadata || {}), github: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {module !== 'profile' && (
                <div>
                  <Label htmlFor='tags'>{module === 'skills' ? 'Skills (comma-separated)' : 'Tags (comma-separated)'}</Label>
                  <Input
                    id='tags'
                    className="mt-2"
                    value={tagText}
                    onChange={(event) => setTagText(event.target.value)}
                    placeholder={module === 'skills' ? 'TypeScript, JavaScript, Python' : 'FastAPI, Next.js, AI'}
                  />
                </div>
              )}

              <div className='flex gap-3 justify-end pt-4 border-t border-ld'>
                {module !== 'profile' && (
                  <Button type='button' variant='outline' onClick={resetForm} className="border-ld">
                    Cancel
                  </Button>
                )}
                <Button type='submit' disabled={saving} className="bg-primary text-white hover:bg-primary/95">
                  {saving ? 'Saving...' : selected ? 'Save Settings' : 'Create Settings'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ContactManager() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [error, setError] = useState('')

  async function load() {
    try {
      setMessages(await listMessages())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load messages')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function mark(id: number, status: ContactMessage['status']) {
    await updateMessage(id, status)
    await load()
  }

  async function remove(id: number) {
    if (!confirm('Delete this message?')) return
    await deleteMessage(id)
    await load()
  }

  return (
    <div className='space-y-6'>
      <div>
        <p className='text-sm font-semibold uppercase tracking-wide text-primary'>Contact</p>
        <h1 className='text-3xl font-bold text-ld'>Manage contact messages</h1>
        <p className='mt-2 text-sm text-link'>Review messages submitted through the portfolio contact form.</p>
      </div>

      {error ? <div className='rounded-sm bg-lighterror p-4 text-sm text-error'>{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>{messages.length} message(s)</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {messages.map((message) => (
            <div key={message.id} className='rounded-md border border-ld p-4'>
              <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                <div>
                  <div className='flex flex-wrap items-center gap-2'>
                    <h2 className='font-semibold text-ld'>{message.subject}</h2>
                    <Badge variant={message.status === 'new' ? 'lightWarning' : 'gray'}>{message.status}</Badge>
                  </div>
                  <p className='mt-1 text-sm text-link'>{message.name} · {message.email}</p>
                  <p className='mt-3 whitespace-pre-wrap text-sm text-ld'>{message.message}</p>
                </div>
                <div className='flex shrink-0 flex-wrap gap-2'>
                  <Button type='button' variant='outline' size='sm' onClick={() => mark(message.id, 'read')}>Read</Button>
                  <Button type='button' variant='outlinewarning' size='sm' onClick={() => mark(message.id, 'archived')}>Archive</Button>
                  <Button type='button' variant='lighterror' size='sm' onClick={() => remove(message.id)}>Delete</Button>
                </div>
              </div>
            </div>
          ))}
          {!messages.length ? <p className='text-sm text-link'>No contact messages yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
