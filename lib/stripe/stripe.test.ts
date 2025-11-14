import { describe, it, expect } from 'vitest'
import Stripe from 'stripe'
import { STRIPE_API_VERSION } from './version'

describe('stripe client', () => {
  it('pins API version', () => {
    expect(STRIPE_API_VERSION).toBe('2025-01-27.acacia')
  })
  it('initializes client with pinned version', () => {
    const client = new Stripe('sk_test_123', { apiVersion: STRIPE_API_VERSION, typescript: true })
    expect(typeof client.checkout.sessions.create).toBe('function')
  })
})
