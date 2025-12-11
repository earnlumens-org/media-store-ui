<template>
  <v-app-bar>
    <v-btn @click="rail = !rail" class="hidden-sm-and-down" icon="mdi-menu"></v-btn>
    <div style="display: flex; flex: 1; align-items: center;">
      <v-icon class="ml-3">
        <img :src="iconPath" alt="Fire Icon" width="24" height="24" />
      </v-icon>
      <v-toolbar-title><b class="pl-1 font-weight-bold text-button">EARNLUMENS</b></v-toolbar-title>
    </div>

    <div style="display: flex; flex: 1; justify-content: flex-end;">
      <cx-search-dialog v-if="true"></cx-search-dialog>
      <cx-language-dialog></cx-language-dialog>
      <cx-dark-light-mode v-if="!loggedIn"></cx-dark-light-mode>
      <cx-login-dialog v-if="!loggedIn"></cx-login-dialog>
      <cx-popover-menu v-else></cx-popover-menu>
    </div>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    :location="drawerLocation"
    :permanent="permanent"
  >
    <v-list density="compact" nav>
      <v-tooltip :text="$t('AppBar.home')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            class="hidden-sm-and-down"
            prepend-icon="mdi-home"
            :title="$t('AppBar.home')"
            value="home"
            to="/"
            exact
          ></v-list-item>
        </template>
      </v-tooltip>

      <v-tooltip :text="$t('AppBar.firststeps')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-sprout-outline"
            :title="$t('AppBar.firststeps')"
            value="firststeps"
            to="/firststeps"
            exact
          ></v-list-item>
        </template>
      </v-tooltip>

      <v-divider></v-divider>

      <v-tooltip :text="$t('AppBar.wallet')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            class="hidden-sm-and-down"
            prepend-icon="mdi-wallet-outline"
            :title="$t('AppBar.wallet')"
            value="wallet"
            to="/wallet"
            exact
            :disabled="!loggedIn"
          ></v-list-item>
        </template>
      </v-tooltip>

      <v-tooltip :text="$t('AppBar.favorites')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-heart-outline"
            :title="$t('AppBar.favorites')"
            value="favorites"
            to="/favorites"
            exact
            :disabled="!loggedIn"
          ></v-list-item>
        </template>
      </v-tooltip>

      <v-tooltip :text="$t('AppBar.purchased')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-shopping-outline"
            :title="$t('AppBar.purchased')"
            value="purchased"
            to="/purchased"
            exact
            :disabled="!loggedIn"
          ></v-list-item>
        </template>
      </v-tooltip>


      <v-divider></v-divider>


      <v-tooltip :text="$t('AppBar.ecosystem')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-creation"
            :title="$t('AppBar.ecosystem')"
            value="ecosystem"
            to="/ecosystem"
            exact
          ></v-list-item>
        </template>
      </v-tooltip>

      <v-tooltip :text="$t('AppBar.community')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-handshake-outline"
            :title="$t('AppBar.community')"
            value="community"
            to="/community"
            exact
          ></v-list-item>
        </template>
      </v-tooltip>

      <v-tooltip :text="$t('AppBar.featured')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-star-outline"
            :title="$t('AppBar.featured')"
            value="featured"
            to="/featured"
            exact
          ></v-list-item>
        </template>
      </v-tooltip>

      <v-tooltip :text="$t('AppBar.explore')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-compass-outline"
            :title="$t('AppBar.explore')"
            value="explore"
            to="/explore"
            exact
          ></v-list-item>
        </template>
      </v-tooltip>

      <v-divider></v-divider>

      <v-tooltip :text="$t('AppBar.account')">
        <template v-slot:activator="{ props }">
          <v-list-item
            v-bind="props"
            prepend-icon="mdi-account-outline"
            :title="$t('AppBar.account')"
            value="account"
            to="/account"
            exact
            :disabled="!loggedIn"
          ></v-list-item>
        </template>
      </v-tooltip>

      <!-- Rail item is positioned at the bottom -->
      <v-list-item style="position: fixed; bottom: 0; width: 100%" @click="rail = !rail">
        <template v-slot:prepend>
          <v-icon>{{
            drawerLocation === "right"
              ? rail
                ? "mdi-chevron-left"
                : "mdi-chevron-right"
              : rail
              ? "mdi-chevron-right"
              : "mdi-chevron-left"
          }}</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>

  <v-bottom-navigation class="hidden-md-and-up" :elevation="9" grow>
    <v-btn to="/" exact>
      <v-icon>mdi-home</v-icon>
      {{ $t("AppBar.home") }}
    </v-btn>

    <v-btn to="/wallet" exact :disabled="!loggedIn">
      <v-icon>mdi-wallet-outline</v-icon>
      {{ $t("AppBar.wallet") }}
    </v-btn>

    <v-btn @click="drawer = !drawer" :active="false">
      <v-icon>mdi-menu</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { storeToRefs } from 'pinia';

// Components
import CxLanguageDialog from "@/components/CxLanguageDialog.vue";
import CxLoginDialog from "@/components/CxLoginDialog.vue";
import CxPopoverMenu from "@/components/CxPopoverMenu.vue";
import CxSearchDialog from "@/components/CxSearchDialog.vue";
// import CxDarkLightMode from "@/components/CxDarkLightMode.vue"; // Previously imported, let's keep it. Note: Check import path in OLD source.
import CxDarkLightMode from "@/components/CxDarkLightMode.vue";

// Assets
import fireIcon from "@/assets/logo.svg";
import fireIconBlack from "@/assets/logo-dm.svg";

// Store
const appStore = useAppStore();
const { mobileView, loggedIn, isDarkTheme, windowWidth } = storeToRefs(appStore);

// Router
const route = useRoute();

// State
const drawer = ref(false);
const rail = ref(true);
const drawerLocation = ref<'left' | 'right' | 'top' | 'bottom'>('right');
const permanent = ref(false);

// Computed
const iconPath = computed(() => {
  return isDarkTheme.value ? fireIcon : fireIconBlack;
});

// Methods
function handleResize() {
  if (mobileView.value) {
    rail.value = false;
    drawer.value = false;
    drawerLocation.value = 'right';
    permanent.value = false;
  } else {
    // Note: windowWidth is strictly typed as number in the store
    if (windowWidth.value < 1264) {
      rail.value = true;
      drawer.value = true;
      drawerLocation.value = 'left';
      permanent.value = true;
    } else {
      rail.value = false;
      drawer.value = true;
      drawerLocation.value = 'left';
      permanent.value = true;
    }
  }
}

// Watchers
// Watch windowWidth to trigger resize logic, replacing the manual event listener from OLD
// since App.vue already tracks resize and updates store.
watch(windowWidth, () => {
  handleResize();
});

// Lifecycle
onMounted(() => {
  handleResize();
});

</script>
