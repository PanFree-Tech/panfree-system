# 🔌 PanFree System — Catálogo de APIs y Endpoints

**Versión:** 2.0.0  
**Última actualización:** 2026-08-28  
**Formato de Intercambio:** JSON (`application/json`)  
**Base URL Local:** `http://localhost:3000`  
**Base URL Producción:** `https://panfree.fit`  

---

## 📋 Resumen de Endpoints

### 🛒 E-commerce & Checkout Público
- `POST /api/calcular-delivery` — Cotiza costo y disponibilidad de envío según zona o coordenadas.
- `POST /api/cupones/validar` — Valida cupones de descuento y calcula ahorro.
- `POST /api/dipticos/canjear` — Canjea códigos QR de dípticos físicos y suma puntos de fidelidad.
- `POST /api/premios/canjear` — Canjea premios del catálogo con puntos de fidelización.
- `POST /api/webhook-pedido` — Webhook de procesamiento y despacho de pedidos.

### 🔔 Notificaciones y Comunicaciones
- `POST /api/notificar-pedido` — Envía orden al orquestador n8n y alerta al staff.
- `POST /api/send-email` — Envío de correos transaccionales con Resend y logging en `email_logs`.
- `POST /api/send-whatsapp` — Envío de mensajes al cliente vía WhatsApp Cloud API / Twilio.
- `POST /api/send-whatsapp-team` — Envío de alertas operativas al grupo del equipo de panadería.
- `POST /api/push-suscribir` — Registra token de suscripción para notificaciones Web Push (VAPID).
- `POST /api/push-notificar` — Despacha notificaciones Web Push a clientes o staff.
- `POST /api/resend-webhook` — Receptor de eventos de entrega/rebote de Resend.

### 📊 Métricas, Analítica y Diagnóstico
- `POST /api/ga4/measurement` — Envía eventos a Google Analytics 4 vía Measurement Protocol (Server-Side).
- `GET /api/resumen-diario` — Resumen ejecutivo diario de ventas y pedidos para el ERP.
- `GET /api/admin/diagnostico` — Chequeo de salud del sistema, conectividad de base de datos y servicios.
- `GET /api/admin/ga-metrics` — Reporte de métricas de adquisición y conversiones de GA4.

### 🤖 Marketing Inteligente & Redes Sociales
- `GET /api/admin/marketing/decidir-promocion` — Algoritmo de recomendación de productos y promociones óptimas.
- `POST /api/admin/marketing/generar-contenido` — Generación de copies publicitarios, hooks y hashtags con Gemini AI.
- `POST /api/admin/marketing/programar-publicacion` — Programa o publica contenido en Instagram Graph API.
- `GET /api/admin/marketing/analizar-resultados` — Análisis de rendimiento e impacto de campañas.
- `GET /api/admin/marketing/consultar-disponibilidad` — Consulta disponibilidad y stock para promocionar.
- `POST /api/admin/marketing/actualizar-capacidad` — Ajusta capacidades de producción Made-To-Order.
- `POST /api/admin/marketing/publish-instagram` — Publicación directa a Instagram Feed/Stories.
- `POST /api/admin/marketing/upload-image` — Carga y procesamiento de creatividades visuales a Cloudinary.

---

## 🛠️ Detalle de Endpoints

### 1. `POST /api/calcular-delivery`
Calcula la tarifa de envío a domicilio según el barrio/zona seleccionada o distancia en kilómetros desde el local en Encarnación.

**Autenticación:** Pública  
**Request Body:**
```json
{
  "zona": "Centro",
  "direccion": "Mcal. Estigarribia c/ Tomás Romero Pereira",
  "subtotal": 120000,
  "lat": -27.3305,
  "lng": -55.8667
}
```
**Response (200 OK):**
```json
{
  "disponible": true,
  "costo": 10000,
  "distancia_km": 2.4,
  "zona": "Centro",
  "tiempo_estimado_min": 30,
  "mensaje": "Entrega disponible en tu zona"
}
```

---

### 2. `POST /api/cupones/validar`
Verifica la validez, vigencia, monto mínimo y límite de uso de un cupón de descuento en el checkout.

**Autenticación:** Pública  
**Request Body:**
```json
{
  "codigo": "BIENVENIDA10",
  "clienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "subtotal": 85000
}
```
**Response (200 OK):**
```json
{
  "valido": true,
  "cupon": {
    "codigo": "BIENVENIDA10",
    "tipo_descuento": "porcentaje",
    "valor_descuento": 10,
    "monto_minimo_compra": 50000
  },
  "descuento": 8500,
  "totalConDescuento": 76500
}
```

---

### 3. `POST /api/dipticos/canjear`
Permite a un cliente autenticado canjear un código de 6 caracteres impreso en los dípticos físicos entregados con las compras.

**Autenticación:** Sesión de usuario activa (Cookie Supabase SSR o Bearer Token)  
**Request Body:**
```json
{
  "codigo": "PF9X2K",
  "clienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "puntos": 100,
  "mensaje": "¡Código canjeado con éxito! +100 puntos añadidos a tu cuenta.",
  "canje": {
    "id": "c1d2e3f4-5678-90ab-cdef-1234567890ab",
    "puntos_ganados": 100
  }
}
```

---

### 4. `POST /api/premios/canjear`
Permite canjear puntos de fidelidad acumulados por un premio del catálogo (descuento, delivery gratis o producto obsequio).

**Autenticación:** Usuario autenticado  
**Request Body:**
```json
{
  "premioId": "p1r2e3m4-5678-90ab-cdef-1234567890ab",
  "clienteId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "mensaje": "¡Premio canjeado con éxito!",
  "cuponGenerado": "PREMIO-DELIV-8X2K",
  "puntosRestantes": 350
}
```

---

### 5. `POST /api/notificar-pedido`
Endpoint server-side que recibe un pedido recién creado, valida los datos mediante Zod, lo reenvía al webhook de automatización de n8n y registra la alerta en `notificaciones_admin`.

**Autenticación:** `Authorization: Bearer <N8N_WEBHOOK_TOKEN>` (opcional si es llamado internamente)  
**Request Body:**
```json
{
  "pedido": {
    "numero": "PF-2026-0042",
    "total": 145000,
    "metodoPago": "transferencia",
    "metodoEntrega": "delivery",
    "items": [
      {
        "nombre": "Pan de Molde Clásico Sin Gluten",
        "cantidad": 2,
        "precio": 35000
      },
      {
        "nombre": "Alfajor de Maicena Artesanal",
        "cantidad": 3,
        "precio": 25000
      }
    ]
  },
  "cliente": {
    "nombre": "María González",
    "email": "maria@ejemplo.com",
    "telefono": "+595981123456",
    "direccion": "Barrio San Roque, Encarnación"
  }
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "message": "Pedido notificado a n8n"
}
```

---

### 6. `POST /api/send-email`
Envía correos electrónicos utilizando la API oficial de Resend y registra de forma auditada cada envío en la tabla `email_logs`.

**Autenticación:** Server-Side / Clientes autorizados  
**Request Body:**
```json
{
  "to": "cliente@correo.com",
  "subject": "Tu pedido PF-2026-0042 ha sido confirmado - PanFree",
  "html": "<h1>¡Hola María!</h1><p>Tu pedido ya está en preparación artesanal...</p>",
  "from": "PanFree <contacto@panfree.fit>",
  "metadata": {
    "pedido_numero": "PF-2026-0042",
    "tipo": "confirmacion_pedido"
  }
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "id": "resend_msg_123456789",
  "log_id": "9f8e7d6c-5b4a-3210-fedc-ba9876543210",
  "to": "cliente@correo.com",
  "from": "PanFree <contacto@panfree.fit>",
  "message": "Correo enviado exitosamente con Resend"
}
```

---

### 7. `POST /api/send-whatsapp`
Despacha notificaciones de WhatsApp vía Meta Cloud API o Twilio con plantillas homologadas.

**Request Body:**
```json
{
  "telefono": "595981123456",
  "tipo": "confirmacion",
  "datos": {
    "nombre": "María",
    "pedido": "PF-2026-0042",
    "total": "145.000 ₲"
  }
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "messageId": "wamid.HBgNNTk1OTgxMTIzNDU2FQIA..."
}
```

---

### 8. `GET /api/resumen-diario`
Provee un resumen ejecutivo de las ventas, cantidad de órdenes por estado y productos con stock crítico del día en curso.

**Autenticación:** Admin / Operador  
**Response (200 OK):**
```json
{
  "fecha": "2026-08-28",
  "total_ventas_pyg": 1850000,
  "pedidos_totales": 14,
  "pedidos_pendientes": 3,
  "pedidos_en_produccion": 5,
  "pedidos_entregados": 6,
  "alertas_stock_insumos": 2
}
```

---

### 9. `POST /api/ga4/measurement`
Envía eventos analíticos de servidor directamente a Google Analytics 4 mediante el protocolo de medición Measurement Protocol.

**Request Body:**
```json
{
  "client_id": "ga4_client_id_12345",
  "events": [
    {
      "name": "purchase",
      "params": {
        "transaction_id": "PF-2026-0042",
        "value": 145000,
        "currency": "PYG",
        "items": [
          { "item_id": "pan-molde-clasico", "item_name": "Pan de Molde Clásico", "price": 35000, "quantity": 2 }
        ]
      }
    }
  ]
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "events_tracked": 1
}
```

---

### 10. `GET /api/admin/marketing/decidir-promocion`
Analiza las reglas comerciales configuradas, las festividades en el calendario astronómico/gastronómico y el stock actual para recomendar la mejor promoción.

**Autenticación:** Admin / Marketing  
**Response (200 OK):**
```json
{
  "promocion_sugerida": {
    "producto": {
      "id": "prod_1",
      "nombre": "Pan de Queso Sin Gluten",
      "precio_regular": 30000,
      "precio_oferta": 24000
    },
    "descuento_porcentaje": 20,
    "regla_aplicada": "Semana del Celíaco",
    "justificacion": "Alta coincidencia con festividad gastronómica y margen disponible de 48%."
  },
  "alternativas": []
}
```

---

### 11. `POST /api/admin/marketing/generar-contenido`
Genera ganchos persuasivos, copies completos, hashtags e ideas de diseño utilizando Google Gemini AI.

**Autenticación:** Admin / Marketing  
**Request Body:**
```json
{
  "producto_nombre": "Pan Dulce Tradicional Sin Gluten",
  "descuento": 15,
  "evento": "Fiestas de Fin de Año",
  "tono": "cálido y familiar"
}
```
**Response (200 OK):**
```json
{
  "hook": "¡La tradición navideña que todos pueden disfrutar en su mesa! 🎄✨",
  "caption": "Nuestro Pan Dulce Artesanal 100% libre de gluten está elaborado con frutos secos seleccionados...",
  "hashtags": ["#PanFree", "#SinGlutenParaguay", "#Encarnacion", "#CeliacosParaguay"],
  "cta": "Pedilo hoy mismo desde panfree.fit y asegurá tu mesa navideña."
}
```

---

### 12. `POST /api/admin/marketing/publish-instagram`
Publica imágenes y stories directamente en la cuenta oficial de Instagram Business a través de Meta Graph API.

**Autenticación:** Admin / Marketing  
**Request Body:**
```json
{
  "image_url": "https://res.cloudinary.com/d7simx38/image/upload/v1/marketing/promo-pan-dulce.jpg",
  "caption": "¡La tradición navideña sin gluten! Pedí online en panfree.fit",
  "format": "feed_4_5"
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "post_id": "18029384756192837",
  "permalink": "https://www.instagram.com/p/DB123456789/"
}
```

---

## 🔒 Estándares de Seguridad y Códigos de Respuesta

| Código HTTP | Significado | Causa Habitual |
|---|---|---|
| `200 OK` | Operación exitosa | Petición procesada correctamente |
| `400 Bad Request` | Parámetros inválidos | Fallo en validación Zod o campos obligatorios faltantes |
| `401 Unauthorized` | No autenticado | Token ausente, expirado o sesión SSR no iniciada |
| `403 Forbidden` | Acceso denegado | Rol de usuario insuficiente para la operación |
| `404 Not Found` | Recurso no encontrado | ID de producto, pedido, cupón o código QR inexistente |
| `500 Internal Error` | Error de servidor | Fallo de conexión con servicios externos (Resend, Supabase, Meta) |
