import Link from 'next/link'
import {
  Shield,
  Lock,
  Database,
  CreditCard,
  UserCheck,
  Eye,
  Server,
  Key,
  FileCheck,
  ShieldCheck,
  Mail,
  ArrowLeft,
} from 'lucide-react'

export const metadata = {
  title: 'Seguridad y Privacidad',
  description:
    'Cómo protegemos tus datos personales, de pago y de estudio en Y Exam Prep.',
}

export default function SeguridadPage() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        {/* Hero */}
        <div className="mb-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-success-500/30 bg-success-500/10 px-3 py-1 text-xs font-semibold text-success-600 dark:text-success-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Infraestructura empresarial
          </div>
          <h1 className="mb-4 text-3xl font-extrabold text-neutral-900 dark:text-white sm:text-4xl">
            Seguridad y Privacidad
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Tus datos personales, tu progreso de estudio y tu información de
            pago viven en infraestructura del mismo nivel que la que usan
            bancos y hospitales. Acá te explicamos cómo.
          </p>
        </div>

        {/* Quick summary cards */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={Lock}
            title="Cifrado de extremo a extremo"
            desc="AES-256 en reposo, TLS 1.3 en tránsito."
          />
          <SummaryCard
            icon={CreditCard}
            title="Pagos seguros"
            desc="Stripe procesa las tarjetas. Nunca las tocamos."
          />
          <SummaryCard
            icon={UserCheck}
            title="Aislamiento total"
            desc="Cada usuario solo ve sus propios datos."
          />
        </div>

        {/* Sections */}
        <div className="space-y-8">
          <Section
            icon={Database}
            title="¿Dónde se guardan tus datos?"
            items={[
              {
                label: 'Base de datos y archivos',
                text: 'Supabase — infraestructura hosteada en Amazon Web Services (Estados Unidos, región US-East). Supabase tiene certificaciones SOC 2 Type II, ISO 27001 y HIPAA-ready. Los datos se replican automáticamente y se respaldan diariamente con recuperación a cualquier punto en los últimos 7 días.',
              },
              {
                label: 'Aplicación web',
                text: 'Render.com, infraestructura cloud con SOC 2 Type II. Todo el tráfico pasa por HTTPS (TLS 1.3). No hay acceso SSH ni consola remota al servidor de producción.',
              },
              {
                label: 'Videos, PDFs y audios',
                text: 'Storage de Supabase, bucket privado. Ningún archivo es accesible por URL directa — cada vez que vas a ver un PDF, el servidor genera un link temporal firmado que expira en 1 hora.',
              },
            ]}
          />

          <Section
            icon={Lock}
            title="Cifrado: cómo protegemos la información"
            items={[
              {
                label: 'En reposo',
                text: 'Toda la base de datos se cifra con AES-256 (estándar militar). Los backups también están cifrados. Si alguien robara un disco físico del data center de AWS, los datos serían ilegibles.',
              },
              {
                label: 'En tránsito',
                text: 'Todo el tráfico entre tu navegador y nuestros servidores usa TLS 1.3 (el mismo protocolo que bancos online). Ninguna petición viaja en texto plano.',
              },
              {
                label: 'Contraseñas',
                text: 'Nunca guardamos tu contraseña en texto. Supabase Auth la hashea con bcrypt antes de tocar la base de datos — ni siquiera nosotros podemos leerla.',
              },
            ]}
          />

          <Section
            icon={CreditCard}
            title="Pagos: nunca tocamos tu tarjeta"
            items={[
              {
                label: 'Procesado por Stripe',
                text: 'Cuando pagás, los datos de tu tarjeta viajan directamente de tu navegador a Stripe. Nuestro servidor nunca los ve, ni los guarda, ni los transmite.',
              },
              {
                label: 'Certificación PCI DSS Level 1',
                text: 'Stripe tiene el nivel más alto de seguridad financiera de la industria — el mismo que usan Amazon, Apple y Shopify para procesar pagos.',
              },
              {
                label: 'Lo único que guardamos',
                text: 'Un identificador (stripe_customer_id) para vincular tu cuenta con tu historial en Stripe. No hay tarjetas, CVV, fechas de vencimiento — nada.',
              },
            ]}
          />

          <Section
            icon={UserCheck}
            title="Aislamiento entre usuarios (Row Level Security)"
            items={[
              {
                label: 'Cada usuario solo ve lo suyo',
                text: 'Usamos "Row Level Security" de PostgreSQL — una capa de seguridad a nivel base de datos. Incluso si un bug del código intentara mostrarte datos de otro estudiante, la base de datos lo rechaza automáticamente.',
              },
              {
                label: 'Auditado',
                text: '14 tablas, 61 políticas de acceso configuradas. Testeamos regularmente con un usuario sin permisos que intenta leer cada tabla — si puede ver algo que no debe, lo arreglamos antes de salir a producción.',
              },
              {
                label: 'Administradores',
                text: 'Solo los roles "admin" y "root" (reservados para Andry y su equipo) pueden ver datos agregados, y siempre queda registro en logs.',
              },
            ]}
          />

          <Section
            icon={Key}
            title="Autenticación y acceso"
            items={[
              {
                label: 'Confirmación de email obligatoria',
                text: 'Para crear cuenta tenés que confirmar tu email. Esto evita registros falsos y previene que alguien cree una cuenta a tu nombre.',
              },
              {
                label: 'Sesiones con expiración',
                text: 'Las sesiones se renuevan automáticamente cada cierto tiempo. Si alguien accede a tu dispositivo, no puede mantener la sesión indefinidamente.',
              },
              {
                label: 'Rate limiting',
                text: 'Intentos de login, registro y cambios de contraseña tienen límite por tiempo. Esto previene ataques de fuerza bruta.',
              },
            ]}
          />

          <Section
            icon={Eye}
            title="Privacidad: qué datos pedimos (y cuáles no)"
            items={[
              {
                label: 'Datos mínimos',
                text: 'Email, nombre completo, teléfono opcional, plan elegido. Eso es todo lo que necesitamos para el servicio.',
              },
              {
                label: 'Lo que NO pedimos',
                text: 'No pedimos DNI, pasaporte, número de Social Security, dirección física, ni ningún documento de identidad. No escaneamos documentos ni verificamos tu identidad más allá del email.',
              },
              {
                label: 'Derecho al olvido',
                text: 'Si querés borrar tu cuenta y todos tus datos asociados, escribinos a soporte. En menos de 30 días eliminamos todo — progreso de estudio, comentarios, posts, datos personales.',
              },
            ]}
          />

          <Section
            icon={FileCheck}
            title="Buenas prácticas técnicas"
            items={[
              {
                label: 'Validación de inputs',
                text: 'Todo lo que escribís en la plataforma pasa por validación con esquemas estrictos (Zod) antes de llegar a la base de datos. Previene inyecciones SQL, XSS y datos malformados.',
              },
              {
                label: 'Headers de seguridad',
                text: 'Content Security Policy, X-Frame-Options, Strict-Transport-Security y Referrer-Policy configurados — previenen clickjacking, inyección de scripts externos y filtración de información.',
              },
              {
                label: 'Auditorías periódicas',
                text: 'Corremos scripts automáticos que verifican cada semana: RLS activo en todas las tablas, buckets correctos, keys no expuestas, vulnerabilidades conocidas.',
              },
            ]}
          />

          <Section
            icon={Server}
            title="¿Qué pasa si hay una filtración?"
            items={[
              {
                label: 'Detección',
                text: 'Tenemos logs en Supabase y Render que trackean intentos de acceso sospechosos. Alertas automáticas ante patrones anómalos.',
              },
              {
                label: 'Contención',
                text: 'Si detectamos algo, podemos revocar todas las sesiones activas y rotar keys en minutos. Los backups nos permiten restaurar a un punto anterior a la filtración.',
              },
              {
                label: 'Notificación',
                text: 'Si tus datos se vieran comprometidos, te avisamos dentro de las 72 horas (estándar GDPR), con detalle de qué pasó y qué hacer.',
              },
            ]}
          />
        </div>

        {/* Footer CTA */}
        <div className="mt-12 rounded-2xl border border-primary-500/30 bg-primary-500/5 p-6 text-center">
          <Mail className="mx-auto mb-3 h-8 w-8 text-primary-600 dark:text-primary-400" />
          <h2 className="mb-2 text-xl font-bold text-neutral-900 dark:text-white">
            ¿Tenés más preguntas de seguridad?
          </h2>
          <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
            Escribinos y te respondemos con el detalle técnico que necesites.
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Crear mi cuenta segura
          </Link>
        </div>

        {/* Subprocessors */}
        <div className="mt-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 p-5">
          <h3 className="mb-2 font-semibold text-neutral-900 dark:text-neutral-100">
            Proveedores que procesan tus datos (subprocesadores)
          </h3>
          <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            <li>
              <strong>Supabase</strong> — base de datos y archivos ·
              <a
                href="https://supabase.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline ml-1"
              >
                Política de seguridad
              </a>
            </li>
            <li>
              <strong>Render.com</strong> — hosting de la app ·
              <a
                href="https://render.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline ml-1"
              >
                Política de seguridad
              </a>
            </li>
            <li>
              <strong>Stripe</strong> — procesamiento de pagos ·
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline ml-1"
              >
                Política de privacidad
              </a>
            </li>
            <li>
              <strong>Anthropic</strong> (fase 2, IA) — asistente de estudio ·
              <a
                href="https://www.anthropic.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline ml-1"
              >
                Política de privacidad
              </a>
            </li>
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          Última actualización: abril de 2026
        </p>
      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────

function SummaryCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="mb-1 font-semibold text-neutral-900 dark:text-neutral-100">
        {title}
      </h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{desc}</p>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  items: { label: string; text: string }[]
}) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-neutral-900 dark:text-white">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        {title}
      </h2>
      <div className="space-y-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
        {items.map((item, i) => (
          <div
            key={i}
            className={i < items.length - 1 ? 'pb-3 border-b border-neutral-100 dark:border-neutral-800' : ''}
          >
            <h3 className="mb-1 font-semibold text-neutral-800 dark:text-neutral-200">
              {item.label}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
