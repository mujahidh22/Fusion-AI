'use client'
import React, { useContext, useEffect, useState } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from '@/components/ui/sidebar'
import Image from 'next/image'
import { Sun, Moon, User2, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { SignInButton, useUser } from '@clerk/nextjs'
import { UserCreditProgress } from './UserCreditProgress'
import moment from 'moment'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext'
import { v4 as uuidv4 } from 'uuid'

function AppSidebar() {
    const { theme, setTheme } = useTheme()
    const { user } = useUser()
    const router = useRouter()
    const {
        chatHistory,
        chatId, setChatId,
        messages, setMessages
    } = useContext(AiSelectedModelContext)

    const getlastUserMessageFromChat = (chat) => {
        const allMessages = Object.values(chat.messages).flat();
        const userMessages = allMessages.filter(message => message.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1]?.content || 'No message';

        const lastUpdated = chat?.lastUpdated || Date.now();
        const formatedDate = moment(lastUpdated).fromNow()

        return {
            chatId: chat?.chatId,
            message: lastUserMessage,
            lastMsgDate: formatedDate
        }
    }

    const handleNewChat = () => {
        // Generate a new chatId, clear messages, and navigate to clean URL
        setChatId(uuidv4())
        setMessages({})
        router.push('/')
    }

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
                    {
                        user ?
                            <Button className='mt-7 w-full' size='lg' onClick={handleNewChat}>+ New Chat</Button>
                            :
                            <SignInButton mode='modal'>
                                <Button className={'w-full'} size='lg'>Sign In/Sign Up</Button>
                            </SignInButton>
                    }
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup />
                <div className='p-3'>
                    <h2 className='text-lg font-bold'>Chat</h2>
                    {!user && <p className='text-sm text-gray-40'>Sign in to start chatting with multiple AI model</p>}
                    {
                        chatHistory?.map((chat, index) => (
                            <Link href={`?chatId=${chat.chatId}`} key={chat.chatId || index} className='mt-1'>
                                <div className={`hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg cursor-pointer ${chatId === chat.chatId ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
                                    <h2 className='text-lg line-clamp-1'>{getlastUserMessageFromChat(chat).message}</h2>
                                    <h2 className='text-sm text-gray-400'>{getlastUserMessageFromChat(chat).lastMsgDate}</h2>
                                </div>
                            </Link>
                        ))
                    }
                </div>
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter >
                <div className='p-3 mb-10'>
                    {
                        !user ?
                            <SignInButton mode='modal'>
                                <Button className={'w-full'} size='lg'>Sign In/Sign Up</Button>
                            </SignInButton>
                            :
                            <div className='w-full'>
                                <UserCreditProgress />
                                <Button className='flex mb-3 w-full'>
                                    <Zap /> <h2>Upgrade to Pro</h2>
                                </Button>
                                <Button className='flex' variant='ghost'>
                                    <User2 /> <h2>Settings</h2>
                                </Button>
                            </div>
                    }
                </div>
            </SidebarFooter>
        </Sidebar >
    )
}

export default AppSidebar