import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react'

export const metadata = {
  title: 'Acceso No Autorizado | PanFree Admin',
  description: 'No tienes los permisos requeridos para acceder a esta sección.',
}

export default function UnauthorizedPage() {
  return (
    <main
      id="unauthorized-page"
      className="min-h-screen bg-[#FFFDF9] text-[#2D2A26] flex items-center justify-center p-4 font-sans"
    >
      <div className="max-w-md w-full bg-white border border-[#F0EBE1] rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#1A1816] mb-2">
          Acceso Restringido
        </h1>

        <p className="text-sm text-[#736B63] mb-6 leading-relaxed">
          Tu cuenta no cuenta con permisos administrativos para acceder a este panel de control. Si eres parte del equipo de PanFree, inicia sesión con tus credenciales de administrador.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/admin/login"
            id="btn-login-admin"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-[#C87D32] hover:bg-[#B36B24] text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            <Lock className="w-4 h-4" />
            Iniciar como Administrador
          </Link>

          <Link
            href="/"
            id="btn-back-home"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-[#F7F4EE] hover:bg-[#EFE9DF] text-[#4A443D] font-medium rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la Tienda
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-[#F5F0E6] text-xs text-[#A89F91]">
          PanFree · Sistema de Gestión Seguro 100% Sin TACC
        </div>
      </div>
    </main>
  )
}
