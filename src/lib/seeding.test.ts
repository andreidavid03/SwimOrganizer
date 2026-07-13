import { test } from 'node:test'
import assert from 'node:assert/strict'
import { laneOrder, buildHeats } from './seeding.ts'

test('laneOrder distribuie din centru spre exterior', () => {
  assert.deepEqual(laneOrder(8), [4, 5, 3, 6, 2, 7, 1, 8])
  assert.deepEqual(laneOrder(6), [3, 4, 2, 5, 1, 6])
  assert.deepEqual(laneOrder(1), [1])
})

test('laneOrder conține fiecare culoar exact o dată', () => {
  for (const n of [4, 5, 7, 10]) {
    const order = laneOrder(n)
    assert.equal(order.length, n)
    assert.deepEqual([...order].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i + 1))
  }
})

test('buildHeats întoarce gol pentru zero înscrieri', () => {
  assert.deepEqual(buildHeats([], 8), [])
})

test('buildHeats: o singură serie incompletă', () => {
  const entries = [
    { seedMs: 3000, data: 'a' },
    { seedMs: 1000, data: 'b' },
    { seedMs: 2000, data: 'c' },
  ]
  const heats = buildHeats(entries, 8)
  assert.equal(heats.length, 1)
  assert.equal(heats[0].heatNumber, 1)
  // cel mai rapid (b, 1000) primește culoarul central (4)
  const central = heats[0].lanes.find(l => l.laneNumber === 4)
  assert.equal(central?.entry.data, 'b')
})

test('buildHeats: cei mai rapizi înoată în ultima serie', () => {
  // 10 înscriși, 5 culoare → 2 serii; seria 2 = cei mai rapizi
  const entries = Array.from({ length: 10 }, (_, i) => ({ seedMs: (i + 1) * 1000, data: `s${i + 1}` }))
  const heats = buildHeats(entries, 5)
  assert.equal(heats.length, 2)
  assert.deepEqual(heats.map(h => h.heatNumber), [1, 2])

  // Ultima serie (heatNumber 2) conține cei mai rapizi 5 (s1..s5)
  const lastHeat = heats.find(h => h.heatNumber === 2)!
  const namesInLast = lastHeat.lanes.map(l => l.entry.data).sort()
  assert.deepEqual(namesInLast, ['s1', 's2', 's3', 's4', 's5'])

  // Cel mai rapid din tot (s1) pe culoarul central al ultimei serii
  const central = lastHeat.lanes.find(l => l.laneNumber === 3)
  assert.equal(central?.entry.data, 's1')
})

test('buildHeats: înscrișii fără timp de referință ajung în prima serie', () => {
  const entries = [
    { seedMs: 1000, data: 'rapid' },
    { seedMs: null, data: 'fara-timp-1' },
    { seedMs: null, data: 'fara-timp-2' },
    { seedMs: 2000, data: 'mediu' },
  ]
  const heats = buildHeats(entries, 2)
  assert.equal(heats.length, 2)
  // Seria 1 (cea mai lentă) îi conține pe cei fără timp
  const firstHeat = heats.find(h => h.heatNumber === 1)!
  const names = firstHeat.lanes.map(l => l.entry.data).sort()
  assert.deepEqual(names, ['fara-timp-1', 'fara-timp-2'])
})
