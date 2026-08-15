let notificationInProgress = false
let lastNotificationTime = 0
const MIN_INTERVAL = 5000

export async function sendNotification(data) {
  const now = Date.now()
  if (notificationInProgress || (now - lastNotificationTime < MIN_INTERVAL)) {
    console.warn('Notificación duplicada evitada por throttle')
    return { success: false, message: 'Throttled' }
  }
  notificationInProgress = true
  lastNotificationTime = now
  try {
    const res = await fetch('/api/push-notificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await res.json()
  } finally {
    notificationInProgress = false
  }
}