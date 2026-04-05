'use client'
import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import AppSidebar from './_components/AppSidebar'
import { AppHeader } from './_components/AppHeader'
import { useUser } from '@clerk/nextjs'
import { db } from '@/config/FirebaseConfig'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext'
import { DefaultModel } from '@/shared/AiModelsShared'
import AiModelList from '@/shared/AiModelList'
import { UserDetailContext } from '@/context/UserDetailContext'
import { useSubscription } from '@/hooks/useSubscription'
import { v4 as uuidv4 } from 'uuid'

// Helper: filter DefaultModel to only include non-premium parent models
const getFreeModels = () => {
    const premiumParents = new Set(AiModelList.filter(m => m.premium).map(m => m.model))
    return Object.fromEntries(
        Object.entries(DefaultModel).filter(([key]) => !premiumParents.has(key))
    )
}

function Provider({ children, ...props }) {

    const { user } = useUser();
    const { isPaidUser } = useSubscription();
    const [aiSelectedModels, setAiSelectedModels] = useState(() =>
        isPaidUser ? DefaultModel : getFreeModels()
    )
    const [userDetail, setUserDetail] = useState()
    const [messages, setMessages] = useState({})
    const [chatId, setChatId] = useState(() => uuidv4())
    const [chatHistory, setChatHistory] = useState([])
    const [msgTokenCount, setMsgTokenCount] = useState(5)

    const getRemainingMessagesCredit = async () => {
        try {
            const result = await axios.get('/api/user-remaining-msg')
            setMsgTokenCount(result?.data?.remainingToken)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (user) {
            CreateNewUser();
            getRemainingMessagesCredit();
        }
    }, [user])

    useEffect(() => {
        if (aiSelectedModels) {
            //update to firebase db
            updateAiModelSelection()
        }
    }, [aiSelectedModels])

    const updateAiModelSelection = async () => {
        //update to Firebase db
        const docRef = doc(db, 'user', user?.primaryEmailAddress?.emailAddress);
        await updateDoc(docRef, { selectedModelPref: aiSelectedModels })
    }

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
            const savedPref = userInfo?.selectedModelPref ?? DefaultModel
            // For free users, filter out any premium models from saved preferences
            if (!isPaidUser) {
                const premiumParents = new Set(AiModelList.filter(m => m.premium).map(m => m.model))
                const filtered = Object.fromEntries(
                    Object.entries(savedPref).filter(([key]) => !premiumParents.has(key))
                )
                setAiSelectedModels(filtered)
            } else {
                // Paid users get all models — merge saved prefs with full DefaultModel
                setAiSelectedModels({ ...DefaultModel, ...savedPref })
            }
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

    // Fetch chat history for the current user
    const refreshChatHistory = useCallback(async () => {
        if (!user?.primaryEmailAddress?.emailAddress) return;
        const q = query(
            collection(db, 'chatHistory'),
            where('userEmail', '==', user.primaryEmailAddress.emailAddress)
        )
        const querySnapshot = await getDocs(q)
        const history = []
        querySnapshot.forEach((doc) => {
            history.push(doc.data())
        })
        // Sort by lastUpdated descending (most recent first)
        history.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0))
        setChatHistory(history)
    }, [user])

    // Load chat history when user is available
    useEffect(() => {
        if (user) {
            refreshChatHistory()
        }
    }, [user, refreshChatHistory])

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            {...props}
        >
            <UserDetailContext.Provider value={{ userDetail, setUserDetail, msgTokenCount, setMsgTokenCount }}>
                <AiSelectedModelContext.Provider value={{
                    aiSelectedModels, setAiSelectedModels,
                    messages, setMessages,
                    chatId, setChatId,
                    chatHistory, refreshChatHistory
                }}>
                    <SidebarProvider>
                        <AppSidebar />
                        <SidebarInset>
                            <AppHeader />
                            {children}
                        </SidebarInset>
                    </SidebarProvider>
                </AiSelectedModelContext.Provider>
            </UserDetailContext.Provider>
        </NextThemesProvider>
    )
}

export default Provider