const DIGITS: Record<string, number> = {
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
}

const SPECIAL: Record<string, number> = {
  cero: 0,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
  veinte: 20,
  docena: 12,
  docenas: 12,
  cien: 100,
  ciento: 100,
  mil: 1000,
}

const TENS: Record<string, number> = {
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function parseSpanishNumber(text: string): number | null {
  if (!text) return null
  const t = normalize(text)

  const docenas = t.match(/(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+docenas?/)
  if (docenas) return DIGITS[docenas[1]] * 12

  const miles = t.match(/(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)\s+mil/)
  if (miles) return DIGITS[miles[1]] * 1000

  const veinti = t.match(/veinti(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)/)
  if (veinti) return 20 + DIGITS[veinti[1]]

  const compound = t.match(
    /(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)\s+y\s+(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)/,
  )
  if (compound) return TENS[compound[1]] + DIGITS[compound[2]]

  const tokens = t.split(/\W+/).filter(Boolean)
  for (const token of tokens) {
    if (token in SPECIAL) return SPECIAL[token]
    if (token in DIGITS) return DIGITS[token]
    if (token in TENS) return TENS[token]
  }

  return null
}
