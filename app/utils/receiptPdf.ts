import type { PaymentConfirmationSummary } from '~/types/payments'

type ReceiptPdfLabels = {
  brand: string
  badge: string
  paidBadge: string
  title: string
  subtitle: string
  receipt: string
  reservationId: string
  paymentId: string
  property: string
  dates: string
  amountPaid: string
  propertyFallback: string
  pending: string
  footer: string
}

type ReceiptPdfOptions = {
  summary: PaymentConfirmationSummary
  formattedDates: string
  formattedAmount: string
  labels: ReceiptPdfLabels
}

type FontName = 'F1' | 'F2'

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842

function toPdfColor(hex: string) {
  const normalized = hex.replace('#', '')
  const r = parseInt(normalized.slice(0, 2), 16) / 255
  const g = parseInt(normalized.slice(2, 4), 16) / 255
  const b = parseInt(normalized.slice(4, 6), 16) / 255
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

function encodeLatin1(value: string) {
  const bytes = new Uint8Array(value.length)

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    bytes[index] = code <= 255 ? code : 63
  }

  return bytes
}

function concatBytes(parts: Uint8Array[]) {
  const totalLength = parts.reduce((sum, item) => sum + item.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }

  return result
}

function estimateTextWidth(text: string, fontSize: number) {
  let total = 0

  for (const character of text) {
    if (character === ' ') total += 0.26
    else if (/[A-Z0-9]/.test(character)) total += 0.58
    else if (/[.,:/-]/.test(character)) total += 0.28
    else total += 0.5
  }

  return total * fontSize
}

function wrapText(text: string, maxWidth: number, fontSize: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (estimateTextWidth(candidate, fontSize) <= maxWidth || !currentLine) {
      currentLine = candidate
      continue
    }

    lines.push(currentLine)
    currentLine = word
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.length ? lines : ['']
}

function drawRect(x: number, y: number, width: number, height: number, fillColor: string, strokeColor?: string, lineWidth = 1) {
  const commands = [
    'q',
    `${fillColor} rg`
  ]

  if (strokeColor) {
    commands.push(`${strokeColor} RG`)
    commands.push(`${lineWidth} w`)
    commands.push(`${x} ${y} ${width} ${height} re B`)
  } else {
    commands.push(`${x} ${y} ${width} ${height} re f`)
  }

  commands.push('Q')
  return commands.join('\n')
}

function drawText(text: string, x: number, y: number, font: FontName, fontSize: number, color: string) {
  return [
    'BT',
    `/${font} ${fontSize} Tf`,
    `${color} rg`,
    `1 0 0 1 ${x} ${y} Tm`,
    `(${escapePdfText(text)}) Tj`,
    'ET'
  ].join('\n')
}

function drawMultilineText(lines: string[], x: number, y: number, font: FontName, fontSize: number, lineHeight: number, color: string) {
  return lines
    .map((line, index) => drawText(line, x, y - (index * lineHeight), font, fontSize, color))
    .join('\n')
}

function drawLine(x1: number, y1: number, x2: number, y2: number, strokeColor: string, lineWidth = 1) {
  return [
    'q',
    `${strokeColor} RG`,
    `${lineWidth} w`,
    `${x1} ${y1} m`,
    `${x2} ${y2} l`,
    'S',
    'Q'
  ].join('\n')
}

function buildPdfDocument(content: string) {
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n',
    `6 0 obj\n<< /Length ${encodeLatin1(content).length} >>\nstream\n${content}\nendstream\nendobj\n`
  ].map(encodeLatin1)

  const header = encodeLatin1('%PDF-1.4\n%âãÏÓ\n')
  const chunks: Uint8Array[] = [header]
  const offsets = [0]
  let currentOffset = header.length

  for (const object of objects) {
    offsets.push(currentOffset)
    chunks.push(object)
    currentOffset += object.length
  }

  const xrefOffset = currentOffset
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    '0000000000 65535 f \n',
    ...offsets.slice(1).map(offset => `${offset.toString().padStart(10, '0')} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  ].join('')

  chunks.push(encodeLatin1(xref))
  return new Blob([concatBytes(chunks)], { type: 'application/pdf' })
}

export function buildReceiptFilename(receiptNumber: string | null) {
  if (!receiptNumber) {
    return 'travelhub-receipt.pdf'
  }

  return `travelhub-${receiptNumber}.pdf`
}

export function createPaymentReceiptPdf({ summary, formattedAmount, formattedDates, labels }: ReceiptPdfOptions) {
  const textColor = toPdfColor('#0f172a')
  const mutedColor = toPdfColor('#64748b')
  const accentColor = toPdfColor('#2563eb')
  const borderColor = toPdfColor('#e2e8f0')
  const pageBg = toPdfColor('#f3f5f9')
  const surfaceColor = toPdfColor('#ffffff')
  const successSoft = toPdfColor('#dcfce7')
  const successColor = toPdfColor('#16a34a')

  const receiptNumber = summary.receipt_number || labels.pending
  const propertyName = summary.property_name || labels.propertyFallback
  const paidBadge = labels.paidBadge.toUpperCase()
  const cardX = 48
  const cardY = 162
  const cardWidth = 499
  const cardHeight = 448
  const contentX = cardX + 28
  const contentWidth = cardWidth - 56
  const valueFontSize = 14
  const badgeWidth = 88
  const badgeX = cardX + cardWidth - 120
  const badgeTextX = badgeX + ((badgeWidth - estimateTextWidth(paidBadge, 10)) / 2)

  const propertyLines = wrapText(propertyName, contentWidth, 19)
  const subtitleLines = wrapText(labels.subtitle, 420, 12)
  const datesLines = wrapText(formattedDates, contentWidth, valueFontSize)
  const amountLines = wrapText(formattedAmount, contentWidth, valueFontSize)
  const reservationLines = wrapText(summary.reservation_id, contentWidth, valueFontSize)
  const paymentLines = wrapText(summary.payment_id, contentWidth, valueFontSize)

  let currentY = cardY + cardHeight - 48
  const commands: string[] = [
    drawRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, pageBg),
    drawText(labels.brand, 48, 794, 'F2', 16, textColor),
    drawText(labels.badge.toUpperCase(), 48, 730, 'F2', 10, accentColor),
    drawMultilineText(wrapText(labels.title, 340, 28), 48, 690, 'F2', 28, 32, textColor),
    drawMultilineText(subtitleLines, 48, 646, 'F1', 12, 18, mutedColor),
    drawRect(cardX, cardY, cardWidth, cardHeight, surfaceColor, borderColor),
    drawRect(cardX, cardY + cardHeight - 4, cardWidth, 4, accentColor),
    drawText(receiptNumber, contentX, currentY, 'F2', 24, textColor),
    drawRect(badgeX, currentY - 14, badgeWidth, 24, successSoft),
    drawText(paidBadge, badgeTextX, currentY - 5, 'F2', 10, successColor),
    drawText(labels.receipt.toUpperCase(), contentX, currentY - 24, 'F2', 10, mutedColor)
  ]

  currentY -= 72
  commands.push(drawText(labels.property.toUpperCase(), contentX, currentY, 'F2', 10, mutedColor))
  currentY -= 22
  commands.push(drawMultilineText(propertyLines, contentX, currentY, 'F2', 19, 24, textColor))
  currentY -= Math.max(propertyLines.length - 1, 0) * 24 + 30

  const addDetailSection = (label: string, lines: string[]) => {
    commands.push(drawLine(contentX, currentY + 10, contentX + contentWidth, currentY + 10, borderColor))
    commands.push(drawText(label.toUpperCase(), contentX, currentY - 12, 'F2', 10, mutedColor))
    commands.push(drawMultilineText(lines, contentX, currentY - 34, 'F1', valueFontSize, 18, textColor))
    currentY -= 52 + Math.max(lines.length - 1, 0) * 18
  }

  addDetailSection(labels.dates, datesLines)
  addDetailSection(labels.amountPaid, amountLines)
  addDetailSection(labels.reservationId, reservationLines)
  addDetailSection(labels.paymentId, paymentLines)

  commands.push(drawLine(contentX, currentY + 10, contentX + contentWidth, currentY + 10, borderColor))
  commands.push(drawText(labels.footer, 48, 116, 'F1', 10, mutedColor))

  const content = commands.join('\n')

  return buildPdfDocument(content)
}
