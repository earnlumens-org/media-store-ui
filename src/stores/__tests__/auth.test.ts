import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/stores/auth'

describe('auth store — setBadge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('is a no-op when there is no user', () => {
    const store = useAuthStore()
    store.setBadge('u1')
    expect(store.user).toBeNull()
  })

  it('sets the profileBadge on the current user, preserving other fields', () => {
    const store = useAuthStore()
    store.setUser({
      id: 'u-1',
      username: 'alice',
      displayName: 'Alice',
      profileImageUrl: 'https://img/alice.png',
      followersCount: 42,
    })

    store.setBadge('u1')

    expect(store.user).toMatchObject({
      id: 'u-1',
      username: 'alice',
      displayName: 'Alice',
      profileImageUrl: 'https://img/alice.png',
      followersCount: 42,
      profileBadge: 'u1',
    })
  })

  it('clears the badge when called with null', () => {
    const store = useAuthStore()
    store.setUser({
      id: 'u-1',
      username: 'alice',
      displayName: 'Alice',
      profileImageUrl: '',
      followersCount: 0,
      profileBadge: 'u1',
    })

    store.setBadge(null)

    expect(store.user?.profileBadge).toBeUndefined()
    expect(store.user?.username).toBe('alice')
  })

  it('does not flip isAuthenticated', () => {
    const store = useAuthStore()
    store.setUser({
      id: 'u-1',
      username: 'alice',
      displayName: 'Alice',
      profileImageUrl: '',
      followersCount: 0,
    })
    expect(store.isAuthenticated).toBe(true)
    store.setBadge('u2')
    expect(store.isAuthenticated).toBe(true)
  })
})
