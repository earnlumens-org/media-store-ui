import u1BlueVerifiedBadge from '@/assets/profileBadge/u1-blue-verified-badge.svg'
import u2YellowVerifiedBadge from '@/assets/profileBadge/u2-yellow-verified-badge.svg'
import u3GrayVerifiedBadge from '@/assets/profileBadge/u3-gray-verified-badge.svg'

export type ProfileBadge = 'u1' | 'u2' | 'u3'

const PROFILE_BADGE_SRC: Record<ProfileBadge, string> = {
  u1: u1BlueVerifiedBadge,
  u2: u2YellowVerifiedBadge,
  u3: u3GrayVerifiedBadge,
}

export function getProfileBadgeSrc (badge?: ProfileBadge) {
  return badge ? PROFILE_BADGE_SRC[badge] : undefined
}

/**
 * Resolve the i18n key for the role label shown under an author's username
 * (the line that historically read "Creator"). It varies by credential:
 *
 *   • u2 (gold) on the main/platform tenant → "Stellar Ecosystem"
 *   • u2 (gold) on a secondary tenant       → "Organization"
 *   • u3 (gray/silver), any tenant          → "Stellar Ambassador"
 *   • u1 (blue)                              → "Creator" (unchanged)
 *   • no badge                              → '' (label is hidden)
 *
 * Callers should hide the label when this returns an empty string.
 *
 * @param isMainTenant true when the visitor is on the platform/default tenant.
 */
export function getCreatorRoleI18nKey (
  badge: ProfileBadge | undefined,
  isMainTenant: boolean,
): string {
  switch (badge) {
    case 'u1': {
      return 'Common.creator'
    }
    case 'u2': {
      return isMainTenant
        ? 'Common.creatorRoleStellarEcosystem'
        : 'Common.creatorRoleOrganization'
    }
    case 'u3': {
      return 'Common.creatorRoleStellarAmbassador'
    }
    default: {
      return ''
    }
  }
}
