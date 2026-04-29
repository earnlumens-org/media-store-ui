<template>
  <v-btn
    block
    class="mt-3 btn-shadow"
    rel="noopener noreferrer"
    size="large"
    variant="outlined"
    @click="redirectToXLogin"
  >
    <span aria-label="Twitter / X" class="x-icon" role="img" v-html="xIconSvg" />
    {{ $t("Common.login") }}
  </v-btn>
</template>

<script setup lang="ts">
  import xIcon from '@/assets/twitterx.svg?raw'
  import { getApiBaseUrl } from '@/config/env'

  const xIconSvg = xIcon

  /**
   * OAuth providers (X today; Google/Apple in the roadmap) only accept a
   * static, exact-match list of redirect URIs — they do NOT support wildcard
   * subdomains. To keep the registration list short and to avoid registering
   * every tenant subdomain on every provider, the entire OAuth handshake is
   * funnelled through a single bounce host per environment:
   *
   *   prod  -> https://earnlumens.org/oauth2/authorization/x?tenant=<sub>
   *   dev   -> https://api-dev.earnlumens.org/oauth2/authorization/x?tenant=<sub>
   *
   * The originating tenant is passed as a query parameter; the backend
   * stores it in its session and the SuccessHandler redirects the browser
   * back to that tenant's /oauth2/callback once the handshake completes
   * (using `mediastore.tenant.root-domain` to pick the correct apex per
   * environment).
   *
   * On localhost (single-tenant developer envs) we keep the
   * direct-to-current-origin behaviour so local development doesn't depend
   * on the cloudflared tunnel.
   */
  function buildOAuthUrl (): string {
    const hostname = globalThis.location.hostname

    // Local dev — Spring runs on a different port; current logic preserved.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost.dv:8080/oauth2/authorization/x'
    }

    // Single-tenant dev tunnel — bounce the OAuth flow through itself.
    if (hostname === 'app-dev.earnlumens.org') {
      return `${getApiBaseUrl()}/oauth2/authorization/x`
    }

    // Tenant subdomain on the dev tunnel: bounce through the dev API host
    // (NOT the prod apex) so we don't burn prod OAuth credentials in local
    // testing and so the SuccessHandler reads the dev root-domain when
    // redirecting back to <tenant>.app-dev.earnlumens.org.
    if (hostname.endsWith('.app-dev.earnlumens.org')) {
      const sub = hostname.slice(0, -'.app-dev.earnlumens.org'.length)
      if (sub === '' || sub.includes('.')) {
        return 'https://api-dev.earnlumens.org/oauth2/authorization/x'
      }
      const params = new URLSearchParams({ tenant: sub })
      return `https://api-dev.earnlumens.org/oauth2/authorization/x?${params.toString()}`
    }

    // Production: send everything through the apex. If we're already on
    // the apex no `tenant` parameter is needed — the SuccessHandler will
    // default to apex on its own.
    if (hostname === 'earnlumens.org') {
      return 'https://earnlumens.org/oauth2/authorization/x'
    }

    // Tenant subdomain: extract the leftmost label and forward it so the
    // SuccessHandler knows where to send the user back to.
    const sub = hostname.split('.')[0] ?? ''
    if (sub === '') {
      return 'https://earnlumens.org/oauth2/authorization/x'
    }
    const params = new URLSearchParams({ tenant: sub })
    return `https://earnlumens.org/oauth2/authorization/x?${params.toString()}`
  }

  function redirectToXLogin (): void {
    localStorage.setItem('preLoginUrl', globalThis.location.pathname)
    globalThis.location.href = buildOAuthUrl()
  }
</script>

<style scoped>
.btn-shadow {
  box-shadow: 0px 0px 10px 0px #FFFFFF !important;
}

.x-icon {
  display: inline-flex;
  width: 24px;
  height: 24px;
  margin-right: 8px;
  color: rgb(var(--v-theme-on-surface));
}

.x-icon :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
