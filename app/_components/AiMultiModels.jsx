'use client'
import React, { useState } from 'react'
import AiModelList from '@/shared/AiModelList'
import Image from 'next/image'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Lock, MessageSquare } from 'lucide-react'

export const AiMultiModels = () => {
    const [aiModelList, setAiModelList] = useState(AiModelList)

    const handleToggleChange = (model, value) => {
        setAiModelList((prev) =>
            prev.map((m) => m.model === model ? { ...m, enable: value } : m)
        )
    }

    return (
        <div className='flex flex-1 h-[75vh] border-b'>

            {
                aiModelList.map((model, index) => (
                    <div className={`   flex flex-col border-r h-full overflow-auto ${model.enable ? 'flex-1 min-w-[400px]' : 'w-[100px] flex-none'}`}>
                        <div key={index} className='w-full flex items-center justify-between border-b p-4 h-[70px]'>
                            <div className='flex items-center gap-4 '>
                                <Image src={model.icon} alt={model.model} width={24} height={24} />
                                {
                                    model.enable && (
                                        <Select>
                                            <SelectTrigger className='w-[180px]'>
                                                <SelectValue placeholder={model.subModel[0].name} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {model.subModel.map((subModel, subIndex) => (
                                                    <SelectItem key={subIndex} value={subModel.name}>
                                                        {subModel.name}
                                                    </SelectItem>
                                                ))}
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
                        {model.enable && model.premium &&
                            <div className='flex justify-center items-center h-[calc(100%-70px)]'>
                                <Button> <Lock />Upgrade to Unlock</Button>
                            </div>
                        }
                    </div>
                ))
            }
        </div>
    )
}
