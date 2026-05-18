import { redirect } from 'next/navigation'

// Registration is now done after payment on /pago/exito.
// Redirect anyone who lands here directly to the pricing page.
export default function RegisterPage() {
  redirect('/precios')
}
