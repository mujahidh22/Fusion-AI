'use client'

import { PricingTable } from '@clerk/nextjs'
import React, { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export const PricingModal = ({ children }) => {
    const [open, setOpen] = useState(false)

    // Capture click events traveling down to the pricing table
    const handleTableClick = (e) => {
        // If the user clicks something that is a button or link (i.e. Subscribe button)
        if (e.target.closest('button') || e.target.closest('a')) {
            setOpen(false) // Close the dialog immediately
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild className='w-full'>{children}</DialogTrigger>
            <DialogContent className='min-w-4xl'>
                <DialogHeader>
                    <DialogTitle>Upgrade Plan</DialogTitle>
                    <DialogDescription asChild>
                        <div onClickCapture={handleTableClick}>
                            <PricingTable />
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}
