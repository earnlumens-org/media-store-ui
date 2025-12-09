<template>
  <div>{{ pageName }}</div>
</template>

<script setup lang="ts">
  const pageName = window.location.pathname.substring(1).toLowerCase()
</script>