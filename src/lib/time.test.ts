import { test } from 'node:test'
import assert from 'node:assert/strict'
import { intervalToMs, formatInterval, parseTimeInput } from './time.ts'

test('intervalToMs interpretează intervalul Postgres', () => {
  assert.equal(intervalToMs('00:01:23.45'), 83450)
  assert.equal(intervalToMs('00:00:45.20'), 45200)
  assert.equal(intervalToMs('00:00:30'), 30000)
  assert.equal(intervalToMs(null), null)
  assert.equal(intervalToMs('aiurea'), null)
})

test('parseTimeInput acceptă formatele uzuale', () => {
  assert.equal(parseTimeInput('1:23.45'), '00:01:23.45')
  assert.equal(parseTimeInput('1:23'), '00:01:23.00')
  assert.equal(parseTimeInput('45.2'), '00:00:45.20')
  // virgulă în loc de punct
  assert.equal(parseTimeInput('45,2'), '00:00:45.20')
  // secunde peste 60 se convertesc în minute
  assert.equal(parseTimeInput('83.4'), '00:01:23.40')
})

test('parseTimeInput respinge valori invalide', () => {
  assert.equal(parseTimeInput(''), null)
  assert.equal(parseTimeInput('abc'), null)
  assert.equal(parseTimeInput('1:99'), null) // secunde invalide cu minute explicite
})

test('formatInterval produce afișare scurtă', () => {
  assert.equal(formatInterval('00:01:23.45'), '1:23.45')
  assert.equal(formatInterval('00:00:45.20'), '45.20')
  assert.equal(formatInterval(null), '—')
})

test('parse → format este consistent (round-trip)', () => {
  for (const input of ['1:23.45', '45.20', '2:05.10']) {
    const interval = parseTimeInput(input)
    assert.notEqual(interval, null)
    // reafișat trebuie să dea aceeași valoare normalizată
    assert.equal(formatInterval(interval), input.replace(/^0/, ''))
  }
})
