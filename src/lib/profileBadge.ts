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
