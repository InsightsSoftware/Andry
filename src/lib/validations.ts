import { z } from 'zod'

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const OFICIOS_LISTA = [
  'Electricidad',
  'Plomería',
  'HVAC / A-C',
  'Albañilería',
  'Carpintería',
  'Pintura',
  'Techos',
  'Remodelación',
  'Otro',
] as const

export type OficioValue = (typeof OFICIOS_LISTA)[number]

export const registerSchema = z.object({
  nombre_completo: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  telefono: z
    .string()
    .min(1, 'El teléfono es obligatorio'),
  direccion: z
    .string()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(200, 'La dirección es demasiado larga'),
  oficio: z
    .string()
    .min(1, 'El oficio es obligatorio'),
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Ingresa un correo válido'),
})

// ============================================
// Community Schemas
// ============================================

export const postDudaSchema = z.object({
  titulo: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título es demasiado largo'),
  contenido: z
    .string()
    .min(10, 'El contenido debe tener al menos 10 caracteres')
    .max(5000, 'El contenido es demasiado largo'),
  capitulo_id: z
    .string()
    .uuid('Capítulo inválido')
    .optional(),
})

export const postTrabajoSchema = z.object({
  titulo: z
    .string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(200, 'El título es demasiado largo'),
  contenido: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(5000, 'La descripción es demasiado larga'),
  ubicacion: z
    .string()
    .min(2, 'La ubicación es obligatoria')
    .max(100, 'La ubicación es demasiado larga'),
  presupuesto: z
    .string()
    .max(50, 'El presupuesto es demasiado largo')
    .optional(),
})

export const comentarioSchema = z.object({
  contenido: z
    .string()
    .min(1, 'El comentario no puede estar vacío')
    .max(2000, 'El comentario es demasiado largo'),
  parent_id: z
    .string()
    .uuid()
    .optional(),
})

// ============================================
// Admin Schemas
// ============================================

export const csvQuestionRowSchema = z.object({
  texto: z.string().min(1, 'El texto de la pregunta es obligatorio'),
  opcion_a: z.string().min(1, 'La opción A es obligatoria'),
  opcion_b: z.string().min(1, 'La opción B es obligatoria'),
  opcion_c: z.string().default(''),
  opcion_d: z.string().default(''),
  respuesta_correcta: z.enum(['a', 'b', 'c', 'd'], {
    error: 'La respuesta debe ser a, b, c o d',
  }),
  explicacion: z.string().default(''),
  pagina_libro: z.coerce.number().int().min(0).default(0),
})

export const examConfigSchema = z.object({
  curso_id: z.string().uuid('Curso inválido'),
  capitulo_id: z.string().uuid('Capítulo inválido').optional(),
  cantidad_preguntas: z.coerce
    .number()
    .int()
    .min(5, 'Mínimo 5 preguntas')
    .max(100, 'Máximo 100 preguntas'),
  tiempo_minutos: z.coerce
    .number()
    .int()
    .min(5, 'Mínimo 5 minutos')
    .max(300, 'Máximo 300 minutos')
    .optional(),
})

// ============================================
// AI Chat Schema
// ============================================

export const aiChatSchema = z.object({
  mensaje: z
    .string()
    .min(1, 'Escribe tu pregunta')
    .max(2000, 'El mensaje es demasiado largo'),
  conversacion_id: z
    .string()
    .uuid()
    .optional(),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type PostDudaInput = z.infer<typeof postDudaSchema>
export type PostTrabajoInput = z.infer<typeof postTrabajoSchema>
export type ComentarioInput = z.infer<typeof comentarioSchema>
export type CSVQuestionRow = z.infer<typeof csvQuestionRowSchema>
export type ExamConfigInput = z.infer<typeof examConfigSchema>
export type AIChatInput = z.infer<typeof aiChatSchema>
