<template>
  <div>@{{ pageName }}</div>
</template>

<script setup lang="ts">
  const pageName = window.location.pathname.slice(1).toLowerCase()
</script>
