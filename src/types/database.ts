export type UserRole = 'estudiante' | 'admin'
export type SubscriptionStatus = 'activa' | 'expirada' | 'cancelada' | 'ninguna'
export type SubscriptionPlan = 'basico' | 'premium' | 'ninguno'
export type ContentType = 'pdf' | 'audio' | 'video'
export type PostType = 'duda' | 'trabajo'
export type ExamType = 'practica' | 'examen'

export interface Profile {
  id: string
  email: string
  nombre_completo: string
  telefono: string | null
  direccion: string | null
  rol: UserRole
  subscription_status: SubscriptionStatus
  subscription_plan: SubscriptionPlan
  subscription_expires_at: string | null
  stripe_customer_id: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Curso {
  id: string
  nombre: string
  slug: string
  descripcion: string
  imagen_url: string | null
  orden: number
  activo: boolean
  created_at: string
}

export interface Capitulo {
  id: string
  curso_id: string
  nombre: string
  numero: number
  pagina_inicio: number
  pagina_fin: number
  descripcion: string | null
  created_at: string
}

export interface Contenido {
  id: string
  capitulo_id: string
  tipo: ContentType
  titulo: string
  descripcion: string | null
  archivo_url: string
  duracion_segundos: number | null
  orden: number
  created_at: string
}

export interface Pregunta {
  id: string
  capitulo_id: string
  texto: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: 'a' | 'b' | 'c' | 'd'
  explicacion: string
  pagina_libro: number
  created_at: string
}

export interface SesionExamen {
  id: string
  user_id: string
  tipo: ExamType
  capitulo_id: string | null
  curso_id: string
  total_preguntas: number
  respuestas_correctas: number
  tiempo_limite_segundos: number | null
  tiempo_usado_segundos: number | null
  completado: boolean
  created_at: string
  finalizado_at: string | null
}

export interface RespuestaUsuario {
  id: string
  sesion_id: string
  pregunta_id: string
  respuesta_seleccionada: 'a' | 'b' | 'c' | 'd' | null
  es_correcta: boolean
  created_at: string
}

export interface PostComunidad {
  id: string
  user_id: string
  tipo: PostType
  titulo: string
  contenido: string
  capitulo_id: string | null
  ubicacion: string | null
  presupuesto: string | null
  resuelto: boolean
  created_at: string
  updated_at: string
  // Joined fields
  autor?: Pick<Profile, 'nombre_completo' | 'avatar_url'>
  _count?: { comentarios: number }
}

export interface Comentario {
  id: string
  post_id: string
  user_id: string
  contenido: string
  parent_id: string | null
  created_at: string
  // Joined fields
  autor?: Pick<Profile, 'nombre_completo' | 'avatar_url'>
}

export interface Pago {
  id: string
  user_id: string
  stripe_payment_intent_id: string
  stripe_checkout_session_id: string | null
  monto_centavos: number
  moneda: string
  plan: SubscriptionPlan
  estado: string
  created_at: string
}

export interface ProgresoEstudio {
  id: string
  user_id: string
  contenido_id: string
  progreso_porcentaje: number
  ultima_posicion: string | null
  completado: boolean
  updated_at: string
}

export interface ConversacionAI {
  id: string
  user_id: string
  titulo: string | null
  created_at: string
  updated_at: string
}

export interface MensajeAI {
  id: string
  conversacion_id: string
  rol: 'user' | 'assistant'
  contenido: string
  paginas_referencia: number[] | null
  created_at: string
}

export type PartnerCategoria =
  | 'creditos'
  | 'contabilidad'
  | 'software'
  | 'seguros'
  | 'legal'
  | 'flota'
  | 'marketing'
  | 'otros'

export interface Partner {
  id: string
  nombre: string
  slug: string
  descripcion: string
  categoria: PartnerCategoria
  logo_url: string | null
  video_url: string
  sitio_web: string | null
  cta_text: string
  orden: number
  destacado: boolean
  activo: boolean
  created_at: string
  updated_at: string
}
