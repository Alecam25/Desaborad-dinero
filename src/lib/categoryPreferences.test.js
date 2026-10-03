import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { SourceTextModule, SyntheticModule, createContext } from 'node:vm'

async function setup({ metadata = {}, local, localBudgets, failSave = false } = {}) {
  const storage = new Map(local ? [['daily-expense-categories:user-1', JSON.stringify(local)]] : [])
  if (localBudgets) storage.set('daily-expense-category-budgets-v6:user-1:cycle-1', JSON.stringify(localBudgets))
  const writes = []
  const context = createContext({
    window: { localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    } },
  })
  const client = new SyntheticModule(['supabase'], function () {
    this.setExport('supabase', { auth: {
      getUser: async () => ({ data: { user: { id: 'user-1', user_metadata: metadata } } }),
      updateUser: async ({ data }) => {
        if (failSave) return { error: new Error('Offline') }
        writes.push(data.daily_expense_categories)
        Object.assign(metadata, data)
        return { error: null }
      },
    } })
  }, { context })
  const budgets = new SourceTextModule(await readFile(new URL('../utils/categoryBudgets.js', import.meta.url), 'utf8'), { context })
  await budgets.link(() => { throw new Error('Unexpected import') })
  const service = new SourceTextModule(await readFile(new URL('./categoryPreferences.js', import.meta.url), 'utf8'), { context })
  await service.link((specifier) => specifier === './supabaseClient' ? client : budgets)
  await service.evaluate()
  return { service: service.namespace, writes, storage, metadata }
}

const custom = [{ name: 'Playa', icon: 'beach', defaultMonthlyLimit: 1000 }]

test('migrates customized local categories into the account', async () => {
  const { service, writes } = await setup({ local: custom })
  const loaded = await service.loadAccountCategories('user-1')
  assert.equal(loaded[0].name, 'Playa')
  assert.equal(writes.length, 1)
})

test('a new device reads account categories instead of old local categories', async () => {
  const { service, writes, storage } = await setup({
    metadata: { daily_expense_categories: custom },
    local: [{ name: 'Vieja', icon: 'package' }],
  })
  assert.equal((await service.loadAccountCategories('user-1'))[0].name, 'Playa')
  assert.equal(writes.length, 0)
  assert.equal(JSON.parse(storage.get('daily-expense-categories:user-1'))[0].name, 'Playa')
})

test('devices without custom categories do not seed the account with defaults', async () => {
  const { service, writes } = await setup()
  const defaults = await service.loadAccountCategories('user-1')
  const other = await setup({ local: defaults })
  await other.service.loadAccountCategories('user-1')
  assert.equal(writes.length, 0)
  assert.equal(other.writes.length, 0)
})

test('rapid edits are saved in order', async () => {
  const { service, writes } = await setup()
  await Promise.all([
    service.saveAccountCategories('user-1', custom),
    service.saveAccountCategories('user-1', [{ ...custom[0], description: 'Cumple' }]),
  ])
  assert.equal(writes.length, 2)
  assert.equal(writes[1][0].description, 'Cumple')
})

test('failed writes reject without replacing local categories', async () => {
  const { service, storage } = await setup({ local: custom, failSave: true })
  await assert.rejects(service.saveAccountCategories('user-1', [{ name: 'Nueva' }]), /Offline/)
  assert.equal(JSON.parse(storage.get('daily-expense-categories:user-1'))[0].name, 'Playa')
})

test('migrates local budget limits and a second device reads the same amounts', async () => {
  const desktop = await setup({ localBudgets: [{ name: 'Playa', monthlyLimit: 500 }] })
  const migrated = await desktop.service.loadAccountBudgets('user-1', 'cycle-1', 2000, custom)
  assert.equal(migrated[0].monthlyLimit, 500)
  const phone = await setup({ metadata: desktop.metadata, localBudgets: [{ name: 'Playa', monthlyLimit: 900 }] })
  const loaded = await phone.service.loadAccountBudgets('user-1', 'cycle-1', 2000, custom)
  assert.equal(loaded[0].monthlyLimit, 500)
  assert.equal(loaded.find((budget) => budget.name === 'Otros').monthlyLimit, 1500)
  assert.equal(phone.writes.length, 0)
})

test('loading default budgets does not upload them from a new device', async () => {
  const { service, writes } = await setup({ localBudgets: [{ name: 'Playa', monthlyLimit: 1000 }] })
  await service.loadAccountBudgets('user-1', 'cycle-1', 2000, custom)
  assert.equal(writes.length, 0)
})

test('saves edits in order and keeps amounts separated by payment cycle', async () => {
  const { service, metadata } = await setup({ metadata: { unrelated: 'kept' } })
  await Promise.all([
    service.saveAccountBudgets('user-1', 'cycle-1', [{ name: 'Playa', monthlyLimit: 500 }]),
    service.saveAccountBudgets('user-1', 'cycle-2', [{ name: 'Playa', monthlyLimit: 800 }]),
    service.saveAccountBudgets('user-1', 'cycle-1', [{ name: 'Playa', monthlyLimit: 700 }]),
  ])
  assert.equal(metadata.daily_expense_cycle_budgets['cycle-1'][0].monthlyLimit, 700)
  assert.equal(metadata.daily_expense_cycle_budgets['cycle-2'][0].monthlyLimit, 800)
  assert.equal(metadata.unrelated, 'kept')
})

test('failed budget writes preserve existing local limits and report failure', async () => {
  const { service, storage } = await setup({ failSave: true, localBudgets: [{ name: 'Playa', monthlyLimit: 500 }] })
  await assert.rejects(service.saveAccountBudgets('user-1', 'cycle-1', [{ name: 'Playa', monthlyLimit: 900 }]), /Offline/)
  assert.equal(JSON.parse(storage.get(service.getBudgetStorageKey('user-1', 'cycle-1')))[0].monthlyLimit, 500)
})

test('rejects saving budgets for a different account', async () => {
  const { service, writes } = await setup()
  await assert.rejects(service.saveAccountBudgets('other-user', 'cycle-1', []), /cuenta activa/)
  assert.equal(writes.length, 0)
})
