# API — Panfree System

**Última revisión:** 2026-08-18

---

## Endpoints Existentes (Detectados)

### POST /api/calcular-delivery

**Descripción:** Calcula costo de envío según zona/dirección y subtotal.

**Request Body:**
```json
{
  "zona": "string",
  "direccion": "string (opcional)",
  "subtotal": "number (opcional)"
}
Response:

json
{
  "disponible": "boolean",
  "costo": "number",
  "distancia_km": "number (opcional)",
  "lat": "number (opcional)",
  "lng": "number (opcional)",
  "mensaje": "string (opcional)"
}
Autenticación: Pública (llamado desde cliente)

Observaciones:

Implementación no inspeccionada

Validar inputs y sanitizar dirección

Aplicar rate limiting

Implementación sugerida:
// src/app/api/calcular-delivery/route.js
import { NextResponse } from 'next/server'

export async function POST(req) {
  const { zona, direccion, subtotal } = await req.json()
  // Validaciones básicas
  // Lógica: tabla de zonas, cálculo costo
  return NextResponse.json({ 
    disponible: true, 
    costo: 5000, 
    distancia_km: 3.2, 
    mensaje: 'Entrega disponible' 
  })
}

POST (client → external) N8N Webhook
URL: NEXT_PUBLIC_N8N_WEBHOOK_URL

Descripción: Recibe payload con pedido y cliente.

Payload:
{
  "pedido": {
    "numero": "string",
    "total": "number",
    "metodoPago": "string",
    "metodoEntrega": "string",
    "items": [
      { "nombre": "string", "cantidad": "number", "precio": "number" }
    ]
  },
  "cliente": {
    "nombre": "string",
    "email": "string",
    "telefono": "string",
    "direccion": "string"
  }
}
WhatsApp Link (No es endpoint)
Descripción: Checkout crea link https://wa.me/<WA_NUMBER>?text=... para que cliente notifique por WhatsApp.

Endpoints Sugeridos / Pendientes de Implementar
POST /api/notificar-pedido
Descripción: Endpoint server-side que recibe el pedido recién creado y:

Envía a n8n (con secreto en server)

Envía notificación push (si aplica)

Crea registro en notificaciones_admin

Autenticación: Servidor (service_role o token interno)

POST /api/send-whatsapp-team
Descripción: Envía mensajes al equipo/WhatsApp.

Request Body:

json
{
  "mensaje": "string",
  "telefono": "string (opcional)",
  "tipo": "pedido | alert"
}
Autenticación: Solo admin / token

POST /api/push-suscribir
Descripción: Registra suscripción web-push del cliente.

Request Body:

json
{
  "endpoint": "string",
  "keys": "object",
  "user_id": "string (opcional)"
}
Autenticación: Pública (validar origen)

POST /api/push-notificar
Descripción: Envía push a suscripción(es) — usado por admin/n8n.

Autenticación: Admin / token

GET /api/resumen-diario
Descripción: Devuelve resumen de ventas (totales, pedidos por estado) para dashboard admin.

Autenticación: Admin

Buenas Prácticas
Práctica	Descripción
Validación	Usar Zod o Joi para validar inputs
Secretos	No exponer en cliente; mover a server-side
Rate Limiting	50-200 req/min en endpoints públicos
Logs	Registrar errores completos en server
Manejo de errores	Devolver { error: message }con status adecuado
CORS	Bloquear orígenes no autorizados
Autenticación	JWT con role admin o service token

Seguridad (CORS / Rate Limiting / Auth)
Configuración	Valor Sugerido
CORS	Permitir https://panfree.fit y localhost:3000
Rate Limiting	50-200 req/min por IP
Autenticación	Admin: JWT con role admin o service token
