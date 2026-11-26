import { describe, expect, it } from 'vitest'
import { escapeCsvCell, toCsv } from './csv'

describe('csv', () => {
  it('membungkus nilai yang mengandung koma, kutip, dan baris baru', () => {
    expect(escapeCsvCell('Bandung, Jawa Barat')).toBe('"Bandung, Jawa Barat"')
    expect(escapeCsvCell('Kata "kutip"')).toBe('"Kata ""kutip"""')
    expect(escapeCsvCell('baris\nbaru')).toBe('"baris\nbaru"')
  })

  it('menetralkan rumus spreadsheet (CSV injection)', () => {
    expect(escapeCsvCell('=HYPERLINK("http://x")')).toBe(`"'=HYPERLINK(""http://x"")"`)
    expect(escapeCsvCell('+62812')).toBe("'+62812")
    expect(escapeCsvCell('@SUM(A1)')).toBe("'@SUM(A1)")
  })

  it('null dan undefined menjadi sel kosong', () => {
    expect(escapeCsvCell(null)).toBe('')
    expect(escapeCsvCell(undefined)).toBe('')
  })

  it('toCsv diawali BOM dan memakai CRLF', () => {
    expect(toCsv(['a', 'b'], [[1, 'x']])).toBe('﻿a,b\r\n1,x\r\n')
  })
})
