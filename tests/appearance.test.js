import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_APPEARANCE,
  resolveAppearance,
  THEMES,
  BACKGROUND_OPTIONS,
  TEXT_OPTIONS,
  selectThemeAppearance,
} from '../src/theme/appearance.js'

test('uses the default theme when appearance is missing', () => {
  const resolved = resolveAppearance()

  assert.equal(resolved.theme.id, DEFAULT_APPEARANCE.themeId)
  assert.equal(resolved.background.id, DEFAULT_APPEARANCE.backgroundId)
  assert.equal(resolved.text.id, DEFAULT_APPEARANCE.textId)
  assert.equal(
    resolved.tokens.appBgStart,
    BACKGROUND_OPTIONS[THEMES.parchment.defaultBackgroundId].appBgStart,
  )
  assert.equal(resolved.tokens.textMain, TEXT_OPTIONS[THEMES.parchment.defaultTextId].textMain)
})

test('applies background and text overrides on top of the selected theme', () => {
  const resolved = resolveAppearance({
    themeId: 'midnight',
    backgroundId: 'mist-blue',
    textId: 'ink-green',
  })

  assert.equal(resolved.theme.id, 'midnight')
  assert.equal(resolved.background.id, 'mist-blue')
  assert.equal(resolved.text.id, 'ink-green')
  assert.equal(resolved.tokens.appBgStart, BACKGROUND_OPTIONS['mist-blue'].appBgStart)
  assert.equal(resolved.tokens.appBgEnd, BACKGROUND_OPTIONS['mist-blue'].appBgEnd)
  assert.equal(resolved.tokens.textMain, TEXT_OPTIONS['ink-green'].textMain)
  assert.equal(resolved.tokens.textStrong, TEXT_OPTIONS['ink-green'].textStrong)
})

test('falls back to defaults when an unknown id is provided', () => {
  const resolved = resolveAppearance({
    themeId: 'missing-theme',
    backgroundId: 'missing-background',
    textId: 'missing-text',
  })

  assert.equal(resolved.theme.id, DEFAULT_APPEARANCE.themeId)
  assert.equal(resolved.background.id, DEFAULT_APPEARANCE.backgroundId)
  assert.equal(resolved.text.id, DEFAULT_APPEARANCE.textId)
})

test('includes a dedicated dark theme for low-light writing', () => {
  assert.ok(THEMES.nocturne)
  assert.equal(THEMES.nocturne.defaultBackgroundId, 'ink-night')
  assert.equal(THEMES.nocturne.defaultTextId, 'moon-silver')

  const resolved = resolveAppearance({ themeId: 'nocturne' })
  assert.equal(resolved.theme.id, 'nocturne')
  assert.equal(resolved.tokens.bodyBg, BACKGROUND_OPTIONS['ink-night'].bodyBg)
  assert.equal(resolved.tokens.textMain, TEXT_OPTIONS['moon-silver'].textMain)
  assert.equal(resolved.tokens.textInverse, THEMES.nocturne.tokens.textInverse)
})

test('selecting a theme resets manual background and text overrides', () => {
  const next = selectThemeAppearance(
    {
      themeId: 'parchment',
      backgroundId: 'ink-night',
      textId: 'ink-blue',
    },
    'forest',
  )

  assert.deepEqual(next, {
    themeId: 'forest',
    backgroundId: 'theme-default',
    textId: 'theme-default',
  })

  const resolved = resolveAppearance(next)
  assert.equal(resolved.tokens.bodyBg, BACKGROUND_OPTIONS[THEMES.forest.defaultBackgroundId].bodyBg)
  assert.equal(resolved.tokens.textMain, TEXT_OPTIONS[THEMES.forest.defaultTextId].textMain)
})
