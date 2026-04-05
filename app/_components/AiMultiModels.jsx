'use client'
import React, { useContext, useState } from 'react'
import AiModelList from '@/shared/AiModelList'
import Image from 'next/image'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Loader, Lock, MessageSquare } from 'lucide-react'
import { AiSelectedModelContext } from '@/context/AiSelectedModelContext'
import { useUser } from '@clerk/nextjs'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useSubscription } from '@/hooks/useSubscription'

export const AiMultiModels = () => {
    const { user } = useUser()
    const { isPaidUser } = useSubscription();

    // If paid user, enable all models. Otherwise use the defaults from AiModelList (premium = disabled).
    const [aiModelList, setAiModelList] = useState(() =>
        AiModelList.map(m => ({
            ...m,
            enable: isPaidUser ? true : m.enable
        }))
    )
    const { messages, setMessages, aiSelectedModels, setAiSelectedModels } = useContext(AiSelectedModelContext)

    const handleToggleChange = (model, value) => {
        // Find model info to check if it's premium
        const modelInfo = AiModelList.find(m => m.model === model)

        // Free users cannot enable premium model panels
        if (!isPaidUser && modelInfo?.premium && value === true) {
            return;
        }

        setAiModelList((prev) =>
            prev.map((m) => m.model === model ? { ...m, enable: value } : m)
        )

        setAiSelectedModels((prev) => ({
            ...prev,
            [model]: {
                ...(prev?.[model] ?? {}),
                enable: value
            }
        }))
    }

    const handleModelChange = async (parentModel, value) => {
        setAiSelectedModels((prev) => ({
            ...prev,
            [parentModel]: {
                ...(prev?.[parentModel] ?? {}),
                modelId: value
            }
        }))
    }

    return (
        <div className='flex flex-1 h-[75vh] border-b overflow-x-auto'>

            {
                aiModelList.map((model) => (
                    <div key={model.model} className={`flex flex-col border-r h-full overflow-auto ${model.enable ? 'flex-1 min-w-[400px]' : 'w-[100px] flex-none'}`}>
                        <div className='w-full flex items-center justify-between border-b p-4 h-[70px]'>
                            <div className='flex items-center gap-4 '>
                                <Image src={model.icon} alt={model.model} width={24} height={24} />
                                {
                                    model.enable && (
                                        <Select defaultValue={aiSelectedModels?.[model.model]?.modelId || ""} onValueChange={(value) => handleModelChange(model.model, value)} disabled={!isPaidUser && model.premium === true}>
                                            <SelectTrigger className='w-[180px]'>
                                                <SelectValue placeholder={aiSelectedModels?.[model.model]?.modelId || "Select Model"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup className='px-3'>
                                                    <SelectLabel className='text-sm text-gray-400'>Free</SelectLabel>
                                                    {model.subModel.map((subModel) => subModel.premium === false && (
                                                        <SelectItem key={subModel.id} value={subModel.id}>
                                                            {subModel.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                                <SelectGroup className='px-3'>
                                                    <SelectLabel className='text-sm text-gray-400'>Premium</SelectLabel>
                                                    {model.subModel.map((subModel) => subModel.premium === true && (
                                                        <SelectItem key={subModel.id} value={subModel.id} disabled={!isPaidUser && subModel.premium}>
                                                            {subModel.name}{!isPaidUser && subModel.premium && <Lock className='h-4 ml-2 w-4 inline' />}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    )
                                }
                            </div>
                            <div>
                                {
                                    model.enable ?
                                        <Switch checked={model.enable} onCheckedChange={(value) => handleToggleChange(model.model, value)} />
                                        :
                                        <MessageSquare onClick={() => handleToggleChange(model.model, true)} />
                                }
                            </div>
                        </div>

                        {!isPaidUser && model.enable && model.premium &&
                            <div className='flex justify-center items-center h-[calc(100%-70px)]'>
                                <Button> <Lock />Upgrade to Unlock</Button>
                            </div>
                        }

                        {model.enable && (
                            <div className='flex-1 p-4'>
                                <div className='flex-1 p-4 space-y-2'>
                                    {
                                        messages[model.model]?.map((msg, index) => (
                                            <div key={index} className={`p-2 rounded-md ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>
                                                {
                                                    msg.role === 'assistant' && (
                                                        <span className='text-sm text-gray-400'>{msg.model ?? model.model}</span>
                                                    )
                                                }
                                                {msg.loading &&
                                                    <>
                                                        <Loader className='animate-spin' />
                                                        <span> Thinking...</span>
                                                    </>
                                                }
                                                {!msg.loading &&
                                                    <Markdown remarkPlugins={[remarkGfm]}>
                                                        {msg.content}
                                                    </Markdown>
                                                }
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                    </div>
                ))
            }
        </div>
    )
}
