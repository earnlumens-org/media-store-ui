<template>
  <v-container>
    <div style="display: flex; justify-content: center;">
      <v-table :style="{ 'max-width': mobileView ? 'auto' : '800px', 'width': '100%' }" theme="dark">
        <thead>
          <tr>
            <th class="text-left text-wrap">Transaction</th>
            <th class="text-left">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in desserts" :key="item.name">
            <td style="word-break: break-all">
              {{ item.name }}
            </td>
            <td>{{ item.calories }}</td>
          </tr>
        </tbody>
      </v-table>
    </div>
  </v-container>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  import { useAppStore } from '@/stores/app'

  const appStore = useAppStore()

  const mobileView = computed(() => appStore.mobileView)

  // TODO: Replace with real transaction data
  const desserts = [
    {
      name: 'GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR',
      calories: 159,
    },
    {
      name: 'GDSTO7OQZKYOUN3ONXGGZUYJUOVGSWBJOUZ67HBB7655TUDSCLYY3EPF',
      calories: -237,
    },
    {
      name: 'GC4WVI4PSD6JPE3Z5ZFUTAREDYCMV2A7EO7SBXPXAC6TK6KVIZ6I2UDU',
      calories: 262,
    },
    {
      name: 'GD5MCNZQ4N2KQ2R6A6HVN7TFTB7U2EHEMZIJIE6O4J2ICOBJFIO5HNSD',
      calories: -305,
    },
    {
      name: 'GD3UDPTBZISTBRIVPXW27FOFBEWOFDZN67PKPEE6ALSDGUQCLHVJNQOD',
      calories: 356,
    },
  ]
</script>
