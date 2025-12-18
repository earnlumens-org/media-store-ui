<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    :scrim="false"
    transition="dialog-top-transition"
  >
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        class="my-1"
        color="grey"
        icon="mdi-magnify"
        type="submit"
      />
    </template>

    <v-card>
      <v-toolbar color="transparent" elevation="0">
        <v-toolbar-title>
          <v-text-field
            v-model="search"
            clearable
            hide-details
            :label="$t('Common.search')"
            prepend-inner-icon="mdi-magnify"
            single-line
          />
        </v-toolbar-title>

        <v-btn icon @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>

      <v-list lines="two">
        <!-- Aquí irían los resultados de búsqueda -->
      </v-list>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  const dialog = ref(false)
  const search = ref('')
</script>
