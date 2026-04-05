import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { SignInButton, SignOutButton, useUser } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'
import React from 'react'

export const AppHeader = () => {
    const { user, isSignedIn } = useUser()

    return (
        <div className='p-3 w-full shadow flex justify-between items-center'>
            <SidebarTrigger />
            {isSignedIn ? (
                <SignOutButton>
                    <Button variant='outline' className='flex items-center gap-2'>
                        <LogOut className='h-4 w-4' />
                        Logout
                    </Button>
                </SignOutButton>
            ) : (
                <SignInButton mode='modal'>
                    <Button>Sign In</Button>
                </SignInButton>
            )}
        </div>
    )
}
