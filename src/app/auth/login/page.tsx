import { Suspense } from 'react'
import { Login } from "@/app/components/auth/login"

const page = () => {
    return (
        <Suspense fallback={null}>
            <Login/>
        </Suspense>
    )
}

export default page;
