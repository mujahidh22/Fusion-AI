'use client'
import React, { useContext, useEffect, useState } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from '@/components/ui/sidebar'
import Image from 'next/image'
import { Sun, Moon, User2, Zap, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { SignInButton, useUser } from '@clerk/nextjs'
import { useSubscription } from '@/hooks/useSubscription'
import { UserCreditProgress } from './UserCreditProgress'
import moment from 'moment'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext'
import { v4 as uuidv4 } from 'uuid'
import { UserDetailContext } from '@/context/UserDetailContext'
import { PricingModal } from './PricingModal'
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '@/config/FirebaseConfig'
import { toast } from 'sonner'

function AppSidebar() {
    const { theme, setTheme } = useTheme()
    const { user } = useUser()
    const router = useRouter()
    const { chatHistory, chatId, setChatId, messages, setMessages, refreshChatHistory } = useContext(AiSelectedModelContext)
    const { msgTokenCount } = useContext(UserDetailContext)
    const { isPaidUser } = useSubscription()

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

    const handleDeleteChat = async (e, targetChatId) => {
        e.preventDefault()   
        e.stopPropagation()  

        try {
            const docRef = doc(db, 'chatHistory', targetChatId)
            await deleteDoc(docRef)

            // If the deleted chat is the currently active one, reset to a new chat
            if (chatId === targetChatId) {
                setChatId(uuidv4())
                setMessages({})
                router.push('/')
            }

            // Refresh sidebar chat history
            await refreshChatHistory()
            toast.success('Chat deleted')
        } catch (error) {
            toast.error('Failed to delete chat:',error)
        }
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
                                <div className={`group flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg cursor-pointer ${chatId === chat.chatId ? 'bg-gray-100 dark:bg-gray-800' : ''}`}>
                                    <div className='flex-1 min-w-0'>
                                        <h2 className='text-lg line-clamp-1'>{getlastUserMessageFromChat(chat).message}</h2>
                                        <h2 className='text-sm text-gray-400'>{getlastUserMessageFromChat(chat).lastMsgDate}</h2>
                                    </div>
                                    <button
                                        onClick={(e) => handleDeleteChat(e, chat.chatId)}
                                        className='opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 shrink-0 ml-2'
                                        title='Delete chat'
                                    >
                                        <Trash2 className='h-4 w-4' />
                                    </button>
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

                                {!isPaidUser &&
                                    <>
                                        <UserCreditProgress msgTokenCount={msgTokenCount} />
                                        <PricingModal>
                                            <Button className='flex mb-3 w-full'>
                                                <Zap /> <h2>Upgrade to Pro</h2>
                                            </Button>
                                        </PricingModal>
                                    </>
                                }
                                <Button className='flex w-full border border-gray-200 dark:border-gray-800' size='lg' variant='ghost'>
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