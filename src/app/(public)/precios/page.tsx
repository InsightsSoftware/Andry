import { redirect } from 'next/navigation'

// La sección de precios ahora vive en la landing (/#precios).
export default function PreciosPage() {
  redirect('/#precios')
}
