import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

/**
 * MYCELIUM-RESILIENCE.md L3 / G4 — the buyer must be able to read, before
 * paying and without a session, what they purchase and what happens on
 * removal, edition and refund (DATA-MODEL.md §13).
 *
 * Pins the contract between the legal locale files, the Terms page and the
 * two entry points (checkout dialog + footer), so a future locale edit cannot
 * silently drop a block or break the `/terms#purchases` deep link.
 */

function read (rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

function legal (lang: string) {
  return JSON.parse(read(`../legal/${lang}.json`)).Legal
}

interface PurchaseSection { heading: string, body: string, items: string[] }

const EXPECTED_HEADINGS = ['A.', 'B.', 'C.', 'D.', 'E.', 'F.']

describe('Legal.purchase (DATA-MODEL §13)', () => {
  for (const lang of ['en', 'es']) {
    describe(lang, () => {
      const block = legal(lang).purchase

      it('exists with title, intro and six sections A–F', () => {
        expect(block.title).toBeTruthy()
        expect(block.intro).toBeTruthy()
        const sections: PurchaseSection[] = block.sections
        expect(sections.map(s => s.heading.slice(0, 2))).toEqual(EXPECTED_HEADINGS)
        for (const s of sections) {
          expect(s.body.length).toBeGreaterThan(40)
          expect(Array.isArray(s.items)).toBe(true)
        }
      })

      it('covers every §13 topic: what is bought, the single exception, refunds, disputes', () => {
        const text = JSON.stringify(block).toLowerCase()
        // §13 "What the user purchases" — entry + collection, perpetual, versions
        expect(text).toMatch(/perpetu/)
        expect(text).toMatch(/collection|colecci/)
        expect(text).toMatch(/version|versi/)
        // §13 "The only exception" — platform removal ⇒ blocked for everyone + automatic dispute
        expect(text).toMatch(/dispute|disputa/)
        // §13 "Refunds" — administrators only, Stellar irreversible, compensating payment
        expect(text).toMatch(/stellar/)
        expect(text).toMatch(/administrator|administrador/)
        // §13 "User responsibilities" — no resale
        expect(text).toMatch(/resold|revender/)
      })

      it('is cross-referenced from the payments clause of the general terms', () => {
        const sec5 = legal(lang).terms.sections[4]
        expect(sec5.heading).toMatch(/^5\./)
        expect(sec5.body).toMatch(/Purchase terms|Términos de compra/)
      })
    })
  }

  it('en and es carry the same structure (section count and bullet counts)', () => {
    const en: PurchaseSection[] = legal('en').purchase.sections
    const es: PurchaseSection[] = legal('es').purchase.sections
    expect(es).toHaveLength(en.length)
    expect(es.map(s => s.items.length)).toEqual(en.map(s => s.items.length))
  })
})

describe('/terms#purchases entry points', () => {
  it('the Terms page renders the anchored purchase block', () => {
    const page = read('../../pages/Terms.vue')
    expect(page).toContain('id="purchases"')
    expect(page).toContain('tm(\'Legal.purchase.sections\')')
    expect(page).toContain('$t(\'Legal.purchase.title\')')
  })

  it('the checkout dialog links to the purchase terms before the buyer pays', () => {
    const dialog = read('../../components/checkout/CheckoutDialog.vue')
    expect(dialog).toContain('\'/terms#purchases\'')
    expect(dialog).toContain('keypath="Preview.payAcceptTerms"')
    for (const lang of ['en', 'es']) {
      const ui = JSON.parse(read(`../${lang}.json`))
      expect(ui.Preview.payAcceptTerms).toContain('{terms}')
      expect(ui.Preview.purchaseTermsLink).toBeTruthy()
    }
  })

  it('the default layout footer links Terms, Purchase terms, Privacy and Guidelines', () => {
    const layout = read('../../layouts/default.vue')
    for (const href of ['to="/terms"', 'to="/terms#purchases"', 'to="/privacy"', 'to="/guidelines"']) {
      expect(layout).toContain(href)
    }
    for (const lang of ['en', 'es']) {
      const ui = JSON.parse(read(`../${lang}.json`))
      expect(ui.Common.purchaseTerms).toBeTruthy()
      expect(ui.Common.guidelines).toBeTruthy()
    }
  })

  it('Terms and Privacy stay public routes (no session required)', () => {
    for (const page of ['Terms', 'Privacy']) {
      const src = read(`../../pages/${page}.vue`)
      expect(src).toMatch(/"requiresAuth":\s*false/)
    }
  })
})
