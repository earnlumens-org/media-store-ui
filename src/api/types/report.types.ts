export interface SubmitReportRequest {
  reason: string
  comment?: string
}

export interface SubmitReportResponse {
  id: string
  severity: string
  message: string
}

export const REPORT_REASONS = [
  // High severity
  { value: 'SCAM', severity: 'HIGH', icon: 'mdi-alert-octagon' },
  { value: 'PHISHING', severity: 'HIGH', icon: 'mdi-fish' },
  { value: 'MALWARE', severity: 'HIGH', icon: 'mdi-bug' },
  { value: 'DOXXING', severity: 'HIGH', icon: 'mdi-account-alert' },
  { value: 'EXTREME_VIOLENCE', severity: 'HIGH', icon: 'mdi-skull' },
  { value: 'ILLEGAL', severity: 'HIGH', icon: 'mdi-gavel' },
  { value: 'CSAM', severity: 'HIGH', icon: 'mdi-shield-alert' },
  { value: 'SELF_HARM', severity: 'HIGH', icon: 'mdi-heart-broken' },
  // Medium severity
  { value: 'HATE_SPEECH', severity: 'MEDIUM', icon: 'mdi-message-alert' },
  { value: 'NSFW', severity: 'MEDIUM', icon: 'mdi-eye-off' },
  { value: 'SPAM', severity: 'MEDIUM', icon: 'mdi-email-multiple' },
  { value: 'IMPERSONATION', severity: 'MEDIUM', icon: 'mdi-account-multiple' },
  // Low severity
  { value: 'COPYRIGHT', severity: 'LOW', icon: 'mdi-copyright' },
  { value: 'STOLEN_CONTENT', severity: 'LOW', icon: 'mdi-content-copy' },
  { value: 'DUPLICATE', severity: 'LOW', icon: 'mdi-content-duplicate' },
  { value: 'OFF_TOPIC', severity: 'LOW', icon: 'mdi-help-circle' },
  { value: 'OTHER', severity: 'LOW', icon: 'mdi-dots-horizontal' },
] as const
