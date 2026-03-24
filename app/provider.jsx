'use client'
import React, { useEffect, useState } from 'react'
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { SidebarProvider } from '@/components/ui/sidebar'
import AppSidebar from './_components/AppSidebar'
import { AppHeader } from './_components/AppHeader'
import { useUser } from '@clerk/nextjs'
import { db } from '@/config/FirebaseConfig'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext'
import { DefaultModel } from '@/shared/AiModelsShared'
import { UserDetailContext } from '@/context/UserDetailContext'

function Provider({ children, ...props }) {

    const { user } = useUser();
    const [aiSelectedModels, setAiSelectedModels] = useState(DefaultModel)
    const [userDetail, setUserDetail] = useState()
    const [messages, setMessages] = useState({})

    useEffect(() => {
        if (user) {
            CreateNewUser();
        }
    }, [user])

    const CreateNewUser = async () => {
        // Initialize a reference to a specific document in the 'user' collection
        // We use the user's primary email address as the unique Document ID
        const userRef = doc(db, 'user', user?.primaryEmailAddress?.emailAddress)

        // Asynchronously fetch the document snapshot from Firestore using the reference
        // This 'awaits' the response to check if the user record already exists in our DB
        const userSnap = await getDoc(userRef)
        //If user exist?
        if (userSnap.exists()) {
            console.log("User already exist")
            const userInfo = userSnap.data()
            setAiSelectedModels(userInfo?.selectedModelPref ?? DefaultModel)
            setUserDetail(userInfo);
            return
        }
        //If user doesn't exist then insert
        else {
            const userData = {
                name: user?.fullName,
                email: user?.primaryEmailAddress?.emailAddress,
                createdAt: new Date(),
                remainingMsg: 5, //only for Free Users
                plan: 'Free',
                credits: 1000 //only for paid users
            }
            await setDoc(userRef, userData)
            console.log("User created successfully")
            setUserDetail(userData)
        }
    }

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            {...props}
        >
            <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
                <AiSelectedModelContext.Provider value={{ aiSelectedModels, setAiSelectedModels, messages, setMessages }}>
                    <SidebarProvider>
                        <AppSidebar />
                        <div className='w-full'>
                            <AppHeader />
                            {children}
                        </div>
                    </SidebarProvider>
                </AiSelectedModelContext.Provider>
            </UserDetailContext.Provider>
        </NextThemesProvider>
    )
}

export default Provider