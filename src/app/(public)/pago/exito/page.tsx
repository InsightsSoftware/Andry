'use client'

import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PaymentSuccessPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success-500/10">
          <CheckCircle className="h-10 w-10 text-success-500" />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-neutral-900">
          ¡Pago exitoso!
        </h1>
        <p className="mb-8 text-neutral-600">
          Tu suscripción está activa. Ya puedes acceder a todo el contenido
          de estudio, el banco de preguntas y el asistente IA.
        </p>

        <Link href="/panel">
          <Button size="lg" fullWidth>
            Ir al Panel de Estudio
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>

        <p className="mt-6 text-sm text-neutral-500">
          Recibirás un correo de confirmación con los detalles de tu compra.
        </p>
      </div>
    </div>
  )
}
