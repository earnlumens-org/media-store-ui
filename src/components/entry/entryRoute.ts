import type { Entry } from './EntryCard.vue'

/**
 * Returns the route path for an entry based on its type and locked state.
 * locked → /preview/:id (purchase page)
 * video  → /watch/:id
 * audio  → /listen/:id
 * image  → /view/:id
 * entry  → /read/:id
 */
export function getEntryRoute (entry: Entry): string {
  if (entry.locked) {
    return `/preview/${entry.id}`
  }
  switch (entry.type) {
    case 'video': { return `/watch/${entry.id}` }
    case 'audio': { return `/listen/${entry.id}` }
    case 'image': { return `/view/${entry.id}` }
    case 'entry': { return `/read/${entry.id}` }
    default: { return `/preview/${entry.id}` }
  }
}
