import React from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from '@/components/ui/sidebar'
import Image from 'next/image'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'

function AppSidebar() {
    const { theme, setTheme } = useTheme()
    return (
        <Sidebar>
            <SidebarHeader >
                <div className='p-3'>
                <div className='flex items-center justify-between p-3'>
                    <div className='flex items-center gap-3'>
                        <Image src='/logo.svg' alt='logo' width={48} height={48} className='h-[40px] w-[40px]' />
                        <h2 className='text-xl font-bold'>Fusion AI</h2>
                    </div>
                    <div>
                        <Button variant='ghost' onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === 'dark' ? <Sun /> : <Moon />}</Button>
                    </div>
                </div>
                <Button className='mt-7 w-full' size='lg'>+ New Chat</Button>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup />
                <div className='p-3'>
                    <h2 className='text-lg font-bold'>Chat</h2>
                    <p className='text-sm text-gray-40'>Sign in to start chatting with multiple AI model</p>
                </div>
                <SidebarGroup />
            </SidebarContent    >
            <SidebarFooter >
                <div className='p-3 mb-10'>
                    <Button className={'w-full'} size='lg'>Sign In/Sign Up</Button>
                </div>
            </SidebarFooter>
        </Sidebar >
    )
}

export default AppSidebar