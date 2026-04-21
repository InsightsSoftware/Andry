/**
 * CSV parser for the question bank. Used by both the client-side uploader
 * (preview step) and server-side restore from backup.
 *
 * Supports two header formats:
 * - Client format: "Question ID,Question,Question Type,Option A,Option B,..."
 * - Legacy format: "texto,opcion_a,opcion_b,opcion_c,opcion_d,respuesta,..."
 */

export interface ParsedQuestion {
  texto: string
  opcion_a: string
  opcion_b: string
  opcion_c: string
  opcion_d: string
  respuesta_correcta: string
  explicacion: string
  pagina_libro: number
  tipo_pregunta: string
}

export interface ParseCsvResult {
  parsed: ParsedQuestion[]
  errors: string[]
}

export function parseQuestionsCsv(text: string): ParseCsvResult {
  const lines = text.split('\n').filter((l) => l.trim())
  const parsed: ParsedQuestion[] = []
  const errs: string[] = []

  if (lines.length === 0) {
    return { parsed, errors: ['El archivo está vacío'] }
  }

  const headerLine = lines[0].toLowerCase()
  const isClientFormat =
    headerLine.includes('question id') || headerLine.includes('question type')
  const isLegacyFormat = headerLine.includes('texto')
  const start = isClientFormat || isLegacyFormat ? 1 : 0

  for (let i = start; i < lines.length; i++) {
    const line = lines[i]
    const cols = parseCsvLine(line)

    if (isClientFormat) {
      // Client format: Question ID, Question, Question Type, Option A, Option B,
      // Option C, Option D, Correct Answer, Explanation
      if (cols.length < 7) {
        errs.push(
          `Fila ${i + 1}: Necesita al menos 7 columnas, tiene ${cols.length}`
        )
        continue
      }

      const texto = cols[1]?.trim()
      const tipoPregunta = cols[2]?.trim() || 'Single Choice'
      const opcion_a = cols[3]?.trim()
      const opcion_b = cols[4]?.trim()
      const opcion_c = cols[5]?.trim()
      const opcion_d = cols[6]?.trim()
      const respuestaRaw = cols[7]?.trim() || ''
      const explicacion = cols[8]?.trim() || ''

      if (!texto) {
        errs.push(`Fila ${i + 1}: Falta el texto de la pregunta`)
        continue
      }
      if (!opcion_a || !opcion_b) {
        errs.push(`Fila ${i + 1}: Se necesitan al menos 2 opciones`)
        continue
      }

      const answerLetters = respuestaRaw
        .split(',')
        .map((a) => a.trim().toLowerCase())
      const validAnswer = answerLetters.find((a) =>
        ['a', 'b', 'c', 'd'].includes(a)
      )

      if (!validAnswer) {
        errs.push(
          `Fila ${i + 1}: Respuesta correcta debe ser A, B, C o D (tiene "${respuestaRaw}")`
        )
        continue
      }

      if (answerLetters.length > 1) {
        errs.push(
          `Fila ${i + 1}: Pregunta de selección múltiple — se usará solo la primera respuesta (${validAnswer.toUpperCase()})`
        )
      }

      parsed.push({
        texto,
        opcion_a,
        opcion_b,
        opcion_c: opcion_c || '',
        opcion_d: opcion_d || '',
        respuesta_correcta: validAnswer,
        explicacion,
        pagina_libro: 0,
        tipo_pregunta: tipoPregunta,
      })
    } else {
      // Legacy format: texto, opcion_a..d, respuesta, explicacion, pagina
      if (cols.length < 6) {
        errs.push(
          `Fila ${i + 1}: Necesita al menos 6 columnas, tiene ${cols.length}`
        )
        continue
      }

      const [texto, opcion_a, opcion_b, opcion_c, opcion_d, respuesta, explicacion, pagina] =
        cols.map((c) => c.trim())

      if (!texto || !opcion_a || !opcion_b || !opcion_c || !opcion_d) {
        errs.push(`Fila ${i + 1}: Faltan campos requeridos`)
        continue
      }

      const resp = respuesta.toLowerCase()
      if (!['a', 'b', 'c', 'd'].includes(resp)) {
        errs.push(
          `Fila ${i + 1}: Respuesta correcta debe ser a, b, c o d (tiene "${respuesta}")`
        )
        continue
      }

      parsed.push({
        texto,
        opcion_a,
        opcion_b,
        opcion_c,
        opcion_d,
        respuesta_correcta: resp,
        explicacion: explicacion || '',
        pagina_libro: parseInt(pagina) || 0,
        tipo_pregunta: 'Single Choice',
      })
    }
  }

  return { parsed, errors: errs }
}

/** Simple CSV line parser that handles quoted fields. */
export function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
