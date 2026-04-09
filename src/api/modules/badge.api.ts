import { apiRequest } from '@/api/apiRequest'

export interface BadgeAssignment {
  id: string
  badgeType: string
  status: string
  assignedBy: string
  startedAt: string | null
  expiresAt: string | null
}

export interface MyBadgesResponse {
  activeBadge: string | null
  assignments: BadgeAssignment[]
}

export async function claimBadge (): Promise<BadgeAssignment> {
  return apiRequest<BadgeAssignment>('/api/user/badges/claim', { method: 'POST' })
}

export async function getMyBadges (): Promise<MyBadgesResponse> {
  return apiRequest<MyBadgesResponse>('/api/user/badges/me')
}
