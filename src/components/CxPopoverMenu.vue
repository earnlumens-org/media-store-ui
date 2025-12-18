<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom"
    >
      <!-- Activador: avatar -->
      <template #activator="{ props }">
        <v-list-item
          v-bind="props"
          class="ma-1"
          nav
          :prepend-avatar="profileImageUrl"
        />
      </template>

      <!-- Contenido del Popover -->
      <v-card min-width="300">

        <!-- Perfil -->
        <v-list>
          <v-list-item
            :prepend-avatar="profileImageUrl"
            :subtitle="username"
            :title="email"
          />
        </v-list>

        <v-divider />

        <!-- Opciones -->
        <v-list>
          <!-- Switch de tema (mock visual, sin lógica) -->
          <v-list-item>
            <v-switch
              v-model="darkMode"
              color="amber-lighten-1"
              hide-details
              label="Dark Mode"
            />
          </v-list-item>

          <!-- Botón subir video (mock) -->
          <v-list-item>
            <v-btn
              color="primary"
              variant="text"
            >
              <v-icon class="me-2">mdi-cloud-upload-outline</v-icon>
              {{ $t("Common.upload") }}
            </v-btn>
          </v-list-item>
        </v-list>

        <v-divider />

        <!-- Logout (mock) -->
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
          >
            {{ $t("Common.logout") }}
          </v-btn>
        </v-card-actions>

      </v-card>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  // Mock data (solo visual)
  const menu = ref(false)
  const darkMode = ref(false)

  const profileImageUrl = 'https://fastly.picsum.photos/id/903/1200/1200.jpg?hmac=8fD_XguoHwGB2RsVu_aX2XwhvCVXRSsvzNAh53Sjobc'
  const username = '@usuario'
  const email = 'user@example.com'
</script>
