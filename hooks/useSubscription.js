import { useAuth } from '@clerk/nextjs'

export function useSubscription() {
    const { has } = useAuth()
    
    // Check if the user possesses the unlimited plan subscription
    const isPaidUser = has?.({ plan: 'unlimited_plan' }) || false;
    
    return { isPaidUser };
}
