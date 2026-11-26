import { describe, expect, it } from 'vitest'
import { proofFileSchema, registrationSchema, tokenSchema } from './validation'

const valid = {
  fullName: 'Siti Nurhaliza',
  nim: '1202230045',
  email: 'siti@student.example.ac.id',
  phone: '0812-3456-7890',
  major: 'Manajemen',
}

function errorsOf(input: Partial<typeof valid>) {
  const result = registrationSchema.safeParse({ ...valid, ...input })
  return result.success ? {} : result.error.flatten().fieldErrors
}

describe('registrationSchema', () => {
  it('menerima data valid dan menormalkan email serta nomor WA', () => {
    const result = registrationSchema.parse({ ...valid, email: '  Siti@Student.Example.ac.id ' })
    expect(result.email).toBe('siti@student.example.ac.id')
    expect(result.phone).toBe('6281234567890')
  })

  it.each(['+62 812 3456 7890', '6281234567890', '081234567890', '0812 3456 789'])(
    'menerima variasi nomor WA %s',
    (phone) => {
      expect(errorsOf({ phone }).phone).toBeUndefined()
    },
  )

  it.each(['12345', '0212345678', '08123', '0812345678901234', 'abc', '+1 555 1234567'])(
    'menolak nomor WA %s',
    (phone) => {
      expect(errorsOf({ phone }).phone).toBeDefined()
    },
  )

  it.each(['123', '12AB345678', '1234567890123456', ''])('menolak NIM %s', (nim) => {
    expect(errorsOf({ nim }).nim).toBeDefined()
  })

  it.each(['bukan-email', 'a@b', '@kampus.ac.id', 'spasi di@email.com'])(
    'menolak email %s',
    (email) => {
      expect(errorsOf({ email }).email).toBeDefined()
    },
  )

  it("menerima nama dengan tanda petik dan titik (Ni Made, M. Rizky, O'Neil)", () => {
    expect(errorsOf({ fullName: "M. Rizky O'Neil" }).fullName).toBeUndefined()
  })

  it('menolak nama berisi angka atau terlalu pendek', () => {
    expect(errorsOf({ fullName: 'Budi123' }).fullName).toBeDefined()
    expect(errorsOf({ fullName: 'Al' }).fullName).toBeDefined()
  })
})

describe('proofFileSchema', () => {
  it('menerima gambar di bawah 2 MB', () => {
    expect(proofFileSchema.safeParse({ type: 'image/jpeg', size: 500_000 }).success).toBe(true)
  })
  it('menolak file lebih dari 2 MB atau bukan gambar', () => {
    expect(proofFileSchema.safeParse({ type: 'image/png', size: 3_000_000 }).success).toBe(false)
    expect(proofFileSchema.safeParse({ type: 'application/pdf', size: 1000 }).success).toBe(false)
  })
})

describe('tokenSchema', () => {
  it('hanya menerima 32 karakter hex', () => {
    expect(tokenSchema.safeParse('a'.repeat(32)).success).toBe(true)
    expect(tokenSchema.safeParse('A'.repeat(32)).success).toBe(false)
    expect(tokenSchema.safeParse("' or 1=1 --").success).toBe(false)
  })
})
