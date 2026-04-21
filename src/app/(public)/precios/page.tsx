import { isPaymentsSimulated } from '@/lib/stripe'
import { PricingPageClient } from './pricing-page-client'

export const metadata = { title: 'Precios' }

export default function PricingPage() {
  // Read on the server so we never leak the raw key to the client —
  // the boolean is the only thing that crosses the boundary.
  const simulated = isPaymentsSimulated()
  return <PricingPageClient simulated={simulated} />
}
