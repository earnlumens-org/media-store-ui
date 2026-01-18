<template>
  <v-card
    class="mx-auto rounded-lg overflow-hidden pa-2 w-100"
    color="surface"
    elevated
  >
    <!-- Media skeleton: replicates MediaFrame with 16:9 aspect ratio -->
    <v-responsive :aspect-ratio="16 / 9">
      <v-sheet
        class="w-100 h-100 rounded-lg skeleton-pulse"
        color="surface-variant"
      />
    </v-responsive>

    <!-- Footer skeleton: replicates EntryFooter height of 84px -->
    <v-sheet class="position-relative" height="84">
      <div class="px-1 pt-2 pb-0 d-flex align-start">
        <!-- Avatar skeleton -->
        <v-sheet
          class="me-4 flex-shrink-0 rounded-circle skeleton-pulse"
          color="surface-variant"
          :height="48"
          :width="48"
        />

        <div class="flex-grow-1 pt-1">
          <!-- Title skeleton: 2 lines -->
          <v-sheet
            class="rounded skeleton-pulse mb-2"
            color="surface-variant"
            height="14"
            width="100%"
          />
          <v-sheet
            class="rounded skeleton-pulse mb-2"
            color="surface-variant"
            height="14"
            width="75%"
          />
          <!-- Author name skeleton -->
          <v-sheet
            class="rounded skeleton-pulse"
            color="surface-variant"
            height="12"
            width="100"
          />
        </div>
      </div>
    </v-sheet>
  </v-card>
</template>

<style scoped>
  .skeleton-pulse {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
</style>
