import WhatsappConfig from '@/models/WhatsappConfig'
import dbConnect from '@/lib/mongodb'

function normalizeIndiaMobile(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  if (!digits) throw new Error('Phone number is empty')
  if (digits.startsWith('91') && digits.length === 12) return digits
  if (digits.length === 10) return `91${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `91${digits.slice(1)}`
  return `91${digits}`
}

interface SendTextOptions {
  clientId: string
  phone: string
  message: string
}

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendWhatsAppText({ clientId, phone, message }: SendTextOptions): Promise<SendResult> {
  try {
    await dbConnect()
    const config = await WhatsappConfig.findOne({ clientId })

    if (!config || !config.enabled) {
      return { success: false, error: 'WhatsApp not enabled for this client' }
    }
    if (!config.accessToken || !config.phoneNumberId) {
      return { success: false, error: 'WhatsApp credentials not configured' }
    }

    const to = normalizeIndiaMobile(phone)
    const graphVersion = config.graphVersion || 'v25.0'

    const res = await fetch(
      `https://graph.facebook.com/${graphVersion}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { preview_url: false, body: message },
        }),
      }
    )

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: data?.error?.message || `HTTP ${res.status}` }
    }

    return { success: true, messageId: data?.messages?.[0]?.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export function formatEntryNotification(entry: {
  recNo: number
  date: string
  paymentMode: string
  partyName: string
  productName: string
  pcs: number
  rate: number
  amount: number
  remarks?: string
  netBalance: number
  netBalanceType: string
  businessName: string
}): string {
  return `*NEW ENTRY*
REC No.   : ${entry.recNo}
DATE      : ${entry.date}
MODE      : ${entry.paymentMode}
PARTY     : ${entry.partyName}
PRODUCT   : ${entry.productName}
PCS       : ${entry.pcs}
RATE      : ${entry.rate.toFixed(2)}
AMOUNT    : ${entry.amount.toFixed(2)}
${entry.remarks ? `REMARK    : ${entry.remarks}` : ''}
NET BALANCE : ${entry.netBalance.toFixed(2)} ${entry.netBalanceType}
FROM : ${entry.businessName}`
}
