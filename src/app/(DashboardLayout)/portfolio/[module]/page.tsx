import ModuleManager from './ModuleManager'
import type { PortfolioModule } from '@/lib/api'
import { notFound } from 'next/navigation'

const allowedModules = ['projects', 'blog', 'articles', 'gallery', 'experience', 'skills', 'profile', 'contact']

export default async function Page({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params
  if (!allowedModules.includes(module)) notFound()

  return <ModuleManager module={module as PortfolioModule | 'contact'} />
}
