'use client'
import { Button } from '@/components/ui/button'
import { Mic, Paperclip, Send } from 'lucide-react'
import React, { useContext, useEffect, useState } from 'react'
import { AiMultiModels } from './AiMultiModels'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext'
import axios from 'axios'

export const ChatInputBox = () => {
    const [userInput, setUserInput] = useState('')
    const { messages, setMessages, aiSelectedModels, setAiSelectedModels } = useContext(AiSelectedModelContext)

    const handleSend = async () => {
        if (!userInput.trim()) return;

        // Add user message to all enabled models
        setMessages((prev) => {
            const updated = { ...prev };
            Object.keys(aiSelectedModels || {}).forEach((modelKey) => {
                updated[modelKey] = [...(updated[modelKey] ?? []), { role: "user", content: userInput }];
            });
            return updated;
        });

        const currentInput = userInput; // capture before reset
        setUserInput("");

        // Fetch response from each enabled model
        Object.entries(aiSelectedModels || {}).forEach(async ([parentModel, modelInfo]) => {
            if (!modelInfo.modelId) return;

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

    useEffect(() => {
        console.log('messages:', messages)
    }, [messages])

    return (
        <div className='relative min-h-screen'>
            {/* Page content */}
            <div>
                <AiMultiModels />
            </div>
            {/* Fixed Chat Input */}
            <div className='fixed bottom-0 left-0 w-full flex justify-center px-4 pb-4'>
                <div className='w-full border rounded-xl shadow-md max-w-2xl p-4'>
                    <input type="text" placeholder='Ask me anything...' className='border-0 outline-none' value={userInput} onChange={(e) => setUserInput(e.target.value)} />
                    <div className='mt-3 flex justify-between items-center'>
                        <Button className='' variant={'ghost'} size={'icon'}>
                            <Paperclip className='h-5 w-5' />
                        </Button>
                        <div className='flex  gap-5'>
                            <Button variant={'ghost'} size={'icon'}><Mic /></Button>
                            <Button size={'icon'} onClick={handleSend}><Send /></Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
