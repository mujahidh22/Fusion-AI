'use client'
import { Button } from '@/components/ui/button'
import { Mic, Paperclip, Send } from 'lucide-react'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { AiMultiModels } from './AiMultiModels'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext'
import AiModelList from '@/shared/AiModelList'
import axios from 'axios'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/config/FirebaseConfig'
import { useUser } from '@clerk/nextjs'
import { useSubscription } from '@/hooks/useSubscription'
import { useSearchParams } from 'next/navigation'
import { UserDetailContext } from '@/context/UserDetailContext'
import { toast } from 'sonner'

export const ChatInputBox = () => {
    const [userInput, setUserInput] = useState('')
    const {
        messages, setMessages,
        aiSelectedModels, setAiSelectedModels,
        chatId, setChatId,
        refreshChatHistory
    } = useContext(AiSelectedModelContext)
    const { msgTokenCount, setMsgTokenCount } = useContext(UserDetailContext)
    const { user } = useUser()
    const params = useSearchParams()
    const { isPaidUser } = useSubscription()

    // Track whether we're currently loading a chat from Firestore
    // to prevent the save useEffect from overwriting data
    const isLoadingChat = useRef(false)

    // When URL params change, either load an existing chat or keep the current new chat
    useEffect(() => {
        const chatIdFromParam = params.get('chatId')
        if (chatIdFromParam) {
            setChatId(chatIdFromParam)
            loadChatMessages(chatIdFromParam)
        }
        // If no chatId param, we keep whatever chatId is already set (from provider)
    }, [params])

    // Load messages for a specific chat from Firestore
    const loadChatMessages = async (id) => {
        isLoadingChat.current = true
        try {
            const docRef = doc(db, 'chatHistory', id)
            const docSnap = await getDoc(docRef)
            if (docSnap.exists()) {
                setMessages(docSnap.data().messages)
            }
        } finally {
            // Small delay to let the state settle before allowing saves again
            setTimeout(() => {
                isLoadingChat.current = false
            }, 500)
        }
    }

    const handleSend = async () => {
        if (!userInput.trim()) return;

        // Block unauthenticated users from sending messages
        if (!user) {
            toast.error("Please sign in to send messages", {
                description: "You need to be logged in to chat with AI models.",
            });
            return;
        }

        // check if user has sufficient credit
        if (msgTokenCount < 1 && !isPaidUser) {
            toast("You don't have enough credits remaining", {
                description: "Wait until the next refill to send more messages.",
                action: {
                    label: "Upgrade",
                    onClick: () => console.log("Upgrade clicked")
                }
            });
            return;
        }

        // Add user message to all enabled models
        setMessages((prev) => {
            const updated = { ...prev };
            Object.keys(aiSelectedModels || {}).forEach((modelKey) => {
                if (aiSelectedModels[modelKey].enable === true) {
                    updated[modelKey] = [...(updated[modelKey] ?? []), { role: "user", content: userInput }];
                }
            });
            return updated;
        });

        const currentInput = userInput; // capture before reset
        setUserInput("");

        // Deduct 1 credit per user message (not per model)
        setMsgTokenCount(prev => prev - 1);

        // Fetch response from each enabled model
        Object.entries(aiSelectedModels || {}).forEach(async ([parentModel, modelInfo]) => {

            if (!modelInfo.modelId || aiSelectedModels[parentModel].enable === false) return;

            // Skip premium models for free users — don't waste API calls
            const modelDef = AiModelList.find(m => m.model === parentModel)
            if (!isPaidUser && modelDef?.premium) return;

            // Add loading placeholder before API call
            setMessages((prev) => ({
                ...prev,
                [parentModel]: [...(prev[parentModel] ?? []), { role: "assistant", content: "Thinking...", model: parentModel, loading: true }]
            }));

            try {
                const result = await axios.post("/api/ai-multi-model", {
                    model: modelInfo.modelId,
                    message: [{ role: "user", content: currentInput }],
                    parentModel
                });

                const { aiResponse, model } = result.data;

                // Add AI response to that model's messages
                setMessages((prev) => {
                    const updated = [...(prev[parentModel] ?? [])];
                    const loadingIndex = updated.findIndex((m) => m.loading);

                    if (loadingIndex !== -1) {
                        updated[loadingIndex] = {
                            role: "assistant",
                            content: aiResponse,
                            model,
                            loading: false,
                        };
                    } else {
                        // fallback if no loading msg found
                        updated.push({
                            role: "assistant",
                            content: aiResponse,
                            model,
                            loading: false,
                        });
                    }

                    return { ...prev, [parentModel]: updated };
                });
            }
            catch (error) {
                console.error("Error fetching from model:", parentModel, error);
                setMessages((prev) => ({
                    ...prev,
                    [parentModel]: [...(prev[parentModel] ?? []),
                    { role: "assistant", content: "Error: " + error.message, loading: false }
                    ]
                }));
            }
        });
    };

    // Save messages to Firestore whenever they change
    useEffect(() => {
        // Don't save if:
        // - chatId is missing
        // - messages is empty
        // - we're in the middle of loading a chat from Firestore
        if (!chatId || !messages || Object.keys(messages).length === 0 || isLoadingChat.current) return;

        handleSaveMessages()
    }, [messages])

    const handleSaveMessages = async () => {
        if (!chatId) return;
        const docRef = doc(db, 'chatHistory', chatId);
        await setDoc(docRef, {
            chatId: chatId,
            userEmail: user?.primaryEmailAddress?.emailAddress,
            messages: messages,
            lastUpdated: Date.now()
        })
        // Refresh sidebar chat history immediately after saving
        refreshChatHistory()
    }

    return (
        <div className='relative min-h-screen'>
            {/* Page content */}
            <div>
                <AiMultiModels />
            </div>
            {/* Fixed Chat Input */}
            <div className='fixed bottom-0 left-0 w-full flex justify-center px-4 pb-8'>
                <div className='flex justify-between items-center w-full border rounded-xl shadow-md max-w-2xl p-4 relative'>
                    {!user && (
                        <div className='absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10'>
                            <p className='text-sm text-muted-foreground'>
                                Please <span className='font-semibold text-foreground'>Sign In</span> to start chatting
                            </p>
                        </div>
                    )}
                    <input type="text"
                        placeholder='Ask me anything...'
                        className='border-0 outline-none w-full'
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={!user}
                    />
                    <div className='flex justify-between items-center'>
                        {/* <Button className='' variant={'ghost'} size={'icon'} disabled={!user}>
                            <Paperclip className='h-5 w-5' />
                        </Button> */}
                        <div className='flex  gap-5'>
                            <Button variant={'ghost'} size={'icon'} disabled={!user}><Mic /></Button>
                            <Button size={'icon'} onClick={handleSend} disabled={!user}><Send /></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}
