'use client'

import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '../shared/CardBox'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { loginAdmin } from '@/lib/api'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useState } from 'react'

export const Login = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('admin@belmond.dev')
  const [password, setPassword] = useState('ChangeMe123!')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await loginAdmin(email, password)
      router.replace(searchParams.get('next') || '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className='h-screen w-full flex justify-center items-center bg-lightprimary'>
        <div className='md:min-w-[450px] min-w-max'>
          <CardBox>
            <div className='flex justify-center mb-4'>
              <FullLogo />
            </div>
            <p className='text-sm text-charcoal text-center mb-6'>
              Portfolio content management
            </p>
            <form className='space-y-5' onSubmit={handleSubmit}>
            <div>
              <div className='mb-2 block'>
                <Label htmlFor='email' className='font-medium'>
                  Email
                </Label>
              </div>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='admin@belmond.dev'
                required
              />
            </div>
            <div>
              <div className='mb-2 block'>
                <Label htmlFor='password' className='font-medium'>
                  Password
                </Label>
              </div>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder='Enter your password'
                required
              />
            </div>
            <div className='flex flex-wrap gap-6 items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Checkbox id='remember' checked />
                <Label
                  className='text-link font-normal text-sm'
                  htmlFor='remember'>
                  Remember this device
                </Label>
              </div>
            </div>
            {error ? <p className='rounded-sm bg-lighterror px-3 py-2 text-sm text-error'>{error}</p> : null}
            <Button className='w-full' type='submit' disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            </form>
          </CardBox>
        </div>
      </div>
    </>
  )
}
