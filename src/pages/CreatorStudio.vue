<template>
  <v-container class="pa-2 pa-sm-4 pa-md-6 mx-auto" fluid style="max-width: 1400px;">
    <!-- ── Header ──────────────────────────────────────────── -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center mb-4 mb-md-6 ga-3">
      <div class="d-flex align-center ga-3 flex-grow-1">
        <v-btn
          icon="mdi-arrow-left"
          size="small"
          variant="text"
          @click="router.push('/account')"
        />
        <div>
          <h1 class="text-h5 text-md-h4 font-weight-bold">
            {{ t('CreatorStudio.title') }}
          </h1>
          <p class="text-body-2 text-medium-emphasis mt-1">
            {{ t('CreatorStudio.subtitle') }}
          </p>
        </div>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="elevated"
        @click="showUploadDialog = true"
      >
        {{ t('CreatorStudio.createNew') }}
      </v-btn>
    </div>

    <!-- ── Dashboard Stats Cards ───────────────────────────── -->
    <v-row class="mb-4 mb-md-6" dense>
      <v-col cols="6" lg="2" md="4" sm="4">
        <v-card class="pa-3 pa-md-4 text-center h-100 d-flex flex-column align-center justify-center" variant="tonal">
          <v-icon class="mb-1" color="primary" size="28">mdi-file-document-multiple-outline</v-icon>
          <div class="text-h6 text-md-h5 font-weight-bold">{{ stats.totalEntries }}</div>
          <div class="text-caption text-medium-emphasis">{{ t('CreatorStudio.stats.total') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" lg="2" md="4" sm="4">
        <v-card class="pa-3 pa-md-4 text-center h-100 d-flex flex-column align-center justify-center" variant="tonal">
          <v-icon class="mb-1" color="success" size="28">mdi-check-circle-outline</v-icon>
          <div class="text-h6 text-md-h5 font-weight-bold">{{ stats.published }}</div>
          <div class="text-caption text-medium-emphasis">{{ t('CreatorStudio.stats.published') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" lg="2" md="4" sm="4">
        <v-card class="pa-3 pa-md-4 text-center h-100 d-flex flex-column align-center justify-center" variant="tonal">
          <v-icon class="mb-1" color="warning" size="28">mdi-pencil-outline</v-icon>
          <div class="text-h6 text-md-h5 font-weight-bold">{{ stats.drafts }}</div>
          <div class="text-caption text-medium-emphasis">{{ t('CreatorStudio.stats.drafts') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" lg="2" md="4" sm="4">
        <v-card class="pa-3 pa-md-4 text-center h-100 d-flex flex-column align-center justify-center" variant="tonal">
          <v-icon class="mb-1" color="info" size="28">mdi-clock-outline</v-icon>
          <div class="text-h6 text-md-h5 font-weight-bold">{{ stats.inReview }}</div>
          <div class="text-caption text-medium-emphasis">{{ t('CreatorStudio.stats.inReview') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" lg="2" md="4" sm="4">
        <v-card class="pa-3 pa-md-4 text-center h-100 d-flex flex-column align-center justify-center" variant="tonal">
          <v-icon class="mb-1" size="28">mdi-eye-outline</v-icon>
          <div class="text-h6 text-md-h5 font-weight-bold">{{ formatNumber(stats.totalViews) }}</div>
          <div class="text-caption text-medium-emphasis">{{ t('CreatorStudio.stats.views') }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" lg="2" md="4" sm="4">
        <v-card
          class="pa-3 pa-md-4 text-center h-100 d-flex flex-column align-center justify-center"
          style="cursor: pointer;"
          variant="tonal"
          @click="router.push('/creator-studio/sales')"
        >
          <v-icon class="mb-1" color="amber" size="28">mdi-cart-check</v-icon>
          <div class="text-h6 text-md-h5 font-weight-bold">{{ stats.totalSales }}</div>
          <div class="text-caption text-medium-emphasis">{{ t('CreatorStudio.stats.sales') }}</div>
          <div class="text-caption text-primary mt-1" style="font-size: 0.7rem;">
            {{ t('CreatorStudio.stats.viewDetails') }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Active / Archived Tabs ───────────────────────────── -->
    <v-tabs
      v-model="activeTab"
      class="mb-4 mb-md-6"
      color="primary"
      density="compact"
      @update:model-value="onTabChange"
    >
      <v-tab value="active">
        <v-icon class="mr-2" size="18">mdi-folder-open-outline</v-icon>
        {{ t('CreatorStudio.tabs.active') }}
      </v-tab>
      <v-tab value="archived">
        <v-icon class="mr-2" size="18">mdi-archive-outline</v-icon>
        {{ t('CreatorStudio.tabs.archived') }}
        <v-badge
          v-if="stats.archived > 0"
          :content="stats.archived"
          inline
        />
      </v-tab>
    </v-tabs>

    <!-- ── Filters + Search Bar ────────────────────────────── -->
    <v-card class="mb-4 mb-md-6 pa-3 pa-md-4" variant="outlined">
      <div class="d-flex flex-column flex-md-row align-start align-md-center ga-3">
        <!-- Search -->
        <v-text-field
          v-model="filters.search"
          class="flex-grow-1"
          clearable
          density="compact"
          hide-details
          :placeholder="t('CreatorStudio.searchPlaceholder')"
          prepend-inner-icon="mdi-magnify"
          style="max-width: 400px;"
          variant="outlined"
          @update:model-value="debouncedFetch"
        />

        <div class="d-flex flex-wrap ga-2">
          <!-- Status filter (only on Active tab) -->
          <v-select
            v-if="activeTab === 'active'"
            v-model="filters.status"
            density="compact"
            hide-details
            :items="statusOptions"
            :label="t('CreatorStudio.filterStatus')"
            style="min-width: 150px;"
            variant="outlined"
            @update:model-value="fetchEntries"
          />

          <!-- Type filter -->
          <v-select
            v-model="filters.type"
            density="compact"
            hide-details
            :items="typeOptions"
            :label="t('CreatorStudio.filterType')"
            style="min-width: 150px;"
            variant="outlined"
            @update:model-value="fetchEntries"
          />

          <!-- Sort -->
          <v-select
            v-model="filters.sort"
            density="compact"
            hide-details
            :items="sortOptions"
            :label="t('CreatorStudio.sortBy')"
            style="min-width: 150px;"
            variant="outlined"
            @update:model-value="fetchEntries"
          />
        </div>
      </div>

      <!-- Active filter chips -->
      <div v-if="hasActiveFilters" class="d-flex flex-wrap ga-2 mt-3">
        <v-chip
          v-if="activeTab === 'active' && filters.status !== 'ALL'"
          closable
          color="primary"
          size="small"
          @click:close="filters.status = 'ALL'; fetchEntries()"
        >
          {{ t('CreatorStudio.filterStatus') }}: {{ getStatusLabel(filters.status) }}
        </v-chip>
        <v-chip
          v-if="filters.type !== 'ALL'"
          closable
          color="primary"
          size="small"
          @click:close="filters.type = 'ALL'; fetchEntries()"
        >
          {{ t('CreatorStudio.filterType') }}: {{ getTypeLabel(filters.type) }}
        </v-chip>
        <v-chip
          v-if="filters.search"
          closable
          color="primary"
          size="small"
          @click:close="filters.search = ''; fetchEntries()"
        >
          {{ t('Common.search') }}: "{{ filters.search }}"
        </v-chip>
        <v-btn size="small" variant="text" @click="clearFilters">
          {{ t('Common.clearFilters') }}
        </v-btn>
      </div>
    </v-card>

    <!-- ── Loading State ───────────────────────────────────── -->
    <div v-if="loading" class="text-center py-12">
      <v-progress-circular color="primary" indeterminate size="48" />
      <p class="mt-4 text-medium-emphasis">{{ t('CreatorStudio.loading') }}</p>
    </div>

    <!-- ── Error State ─────────────────────────────────────── -->
    <v-alert v-else-if="error" class="mb-4" type="error" variant="tonal">
      <strong>{{ t('CreatorStudio.errorTitle') }}</strong>
      <p class="mt-1">{{ error }}</p>
      <template #append>
        <v-btn size="small" variant="text" @click="fetchEntries">
          {{ t('Common.retry') }}
        </v-btn>
      </template>
    </v-alert>

    <!-- ── Empty State ─────────────────────────────────────── -->
    <v-card v-else-if="entries.length === 0 && !loading" class="text-center pa-8 pa-md-12 bg-transparent" variant="flat">
      <v-icon class="mb-4" color="medium-emphasis" size="80">mdi-movie-open-plus-outline</v-icon>
      <h3 class="text-h6 mb-2">{{ hasActiveFilters ? t('CreatorStudio.noResults') : t('CreatorStudio.empty') }}</h3>
      <p class="text-medium-emphasis mb-6">
        {{ hasActiveFilters ? t('CreatorStudio.noResultsDescription') : t('CreatorStudio.emptyDescription') }}
      </p>
      <v-btn
        v-if="hasActiveFilters"
        class="mr-2"
        variant="outlined"
        @click="clearFilters"
      >
        {{ t('Common.clearFilters') }}
      </v-btn>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        variant="elevated"
        @click="showUploadDialog = true"
      >
        {{ t('CreatorStudio.uploadFirst') }}
      </v-btn>
    </v-card>

    <!-- ── Content Table (Desktop md+) ─────────────────────── -->
    <v-card v-else-if="!mobileView" variant="outlined">
      <v-table fixed-header hover style="table-layout: fixed; width: 100%;">
        <colgroup>
          <col style="width: 40%;">
          <col style="width: 14%;">
          <col style="width: 14%;">
          <col style="width: 14%;">
          <col style="width: 12%;">
          <col style="width: 6%;">
        </colgroup>
        <thead>
          <tr>
            <th class="text-left">{{ t('CreatorStudio.table.content') }}</th>
            <th class="text-center">{{ t('CreatorStudio.table.status') }}</th>
            <th class="text-center">{{ t('CreatorStudio.table.type') }}</th>
            <th class="text-center">{{ t('CreatorStudio.table.date') }}</th>
            <th class="text-center">{{ t('CreatorStudio.table.price') }}</th>
            <th class="text-center">{{ t('CreatorStudio.table.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in entries"
            :key="entry.id"
            class="cursor-pointer"
            @click="goToEntry(entry)"
          >
            <!-- Content cell: thumbnail + title + description -->
            <td style="max-width: 0;">
              <div class="d-flex align-center ga-3 py-2">
                <v-card
                  class="flex-shrink-0 overflow-hidden"
                  flat
                  rounded="lg"
                  width="120"
                >
                  <v-img
                    :alt="entry.title"
                    :aspect-ratio="16 / 9"
                    cover
                    :src="entry.thumbnailUrl"
                  >
                    <template #error>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <v-icon color="medium-emphasis" size="28">{{ getTypeIcon(entry.type) }}</v-icon>
                      </div>
                    </template>
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <v-icon color="medium-emphasis" size="28">{{ getTypeIcon(entry.type) }}</v-icon>
                      </div>
                    </template>
                  </v-img>
                </v-card>
                <div class="overflow-hidden" style="min-width: 0;">
                  <div
                    class="text-body-2 font-weight-medium"
                    :style="{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }"
                  >
                    {{ entry.title }}
                  </div>
                  <div v-if="entry.description" class="text-caption text-medium-emphasis text-truncate">
                    {{ entry.description }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Status chip -->
            <td class="text-center text-no-wrap">
              <v-chip
                :color="getStatusColor(entry.status)"
                size="small"
                variant="tonal"
              >
                <v-icon size="14" start>{{ getStatusIcon(entry.status) }}</v-icon>
                {{ getStatusLabel(entry.status) }}
              </v-chip>
            </td>

            <!-- Type -->
            <td class="text-center text-no-wrap">
              <v-chip size="small" variant="flat">
                <v-icon size="14" start>{{ getTypeIcon(entry.type) }}</v-icon>
                {{ getTypeLabel(entry.type) }}
              </v-chip>
            </td>

            <!-- Date -->
            <td class="text-center text-no-wrap">
              <span class="text-body-2 text-medium-emphasis">{{ formatDate(entry.publishedAt || entry.createdAt) }}</span>
            </td>

            <!-- Price -->
            <td class="text-center">
              <span v-if="entry.isPaid" class="text-body-2 font-weight-medium">
                {{ entry.priceXlm }} XLM
              </span>
              <v-chip v-else color="success" size="x-small" variant="tonal">
                {{ t('CreatorStudio.free') }}
              </v-chip>
            </td>

            <!-- Actions -->
            <td class="text-center" @click.stop>
              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="text"
                  />
                </template>
                <v-list density="compact" min-width="180">
                  <v-list-item prepend-icon="mdi-eye-outline" @click="goToEntry(entry)">
                    <v-list-item-title>{{ t('CreatorStudio.actions.view') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-pencil-outline" @click="openEditDialog(entry)">
                    <v-list-item-title>{{ t('CreatorStudio.actions.edit') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="entry.status === 'DRAFT'"
                    prepend-icon="mdi-send-outline"
                    @click="submitForReview(entry)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.submitReview') }}</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item
                    v-if="entry.status !== 'ARCHIVED'"
                    prepend-icon="mdi-archive-outline"
                    @click="confirmArchive(entry)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.archive') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="entry.status === 'ARCHIVED'"
                    class="text-success"
                    prepend-icon="mdi-archive-arrow-up-outline"
                    @click="executeUnarchive(entry)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.unarchive') }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Pagination -->
      <v-divider />
      <div class="d-flex align-center justify-space-between pa-3">
        <span class="text-body-2 text-medium-emphasis">
          {{ t('CreatorStudio.showingEntries', { count: entries.length, total: totalElements }) }}
        </span>
        <v-pagination
          v-if="totalPages > 1"
          v-model="currentPage"
          density="compact"
          :length="totalPages"
          rounded
          @update:model-value="onPageChange"
        />
      </div>
    </v-card>

    <!-- ── Content Cards (Mobile < md) ─────────────────────── -->
    <div v-else class="mobile-entries">
      <v-card
        v-for="entry in entries"
        :key="entry.id"
        class="mb-3"
        variant="outlined"
        @click="goToEntry(entry)"
      >
        <div class="d-flex pa-3 ga-3">
          <!-- Thumbnail -->
          <v-card
            class="flex-shrink-0 overflow-hidden"
            flat
            rounded="lg"
            width="100"
          >
            <v-img
              :alt="entry.title"
              :aspect-ratio="16 / 9"
              cover
              :src="entry.thumbnailUrl"
            >
              <template #error>
                <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                  <v-icon color="medium-emphasis" size="24">{{ getTypeIcon(entry.type) }}</v-icon>
                </div>
              </template>
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                  <v-icon color="medium-emphasis" size="24">{{ getTypeIcon(entry.type) }}</v-icon>
                </div>
              </template>
            </v-img>
          </v-card>

          <!-- Info -->
          <div class="flex-grow-1 overflow-hidden">
            <div
              class="text-body-2 font-weight-medium"
              :style="{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }"
            >
              {{ entry.title }}
            </div>
            <div class="d-flex flex-wrap align-center ga-1 mt-1">
              <v-chip
                :color="getStatusColor(entry.status)"
                size="x-small"
                variant="tonal"
              >
                {{ getStatusLabel(entry.status) }}
              </v-chip>
              <v-chip size="x-small" variant="flat">
                {{ getTypeLabel(entry.type) }}
              </v-chip>
              <span v-if="entry.isPaid" class="text-caption font-weight-medium">
                {{ entry.priceXlm }} XLM
              </span>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ formatDate(entry.publishedAt || entry.createdAt) }}
            </div>
          </div>

          <!-- Actions menu -->
          <div @click.stop>
            <v-menu location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  size="x-small"
                  variant="text"
                />
              </template>
              <v-list density="compact" min-width="180">
                <v-list-item prepend-icon="mdi-eye-outline" @click="goToEntry(entry)">
                  <v-list-item-title>{{ t('CreatorStudio.actions.view') }}</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-pencil-outline" @click="openEditDialog(entry)">
                  <v-list-item-title>{{ t('CreatorStudio.actions.edit') }}</v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-if="entry.status === 'DRAFT'"
                  prepend-icon="mdi-send-outline"
                  @click="submitForReview(entry)"
                >
                  <v-list-item-title>{{ t('CreatorStudio.actions.submitReview') }}</v-list-item-title>
                </v-list-item>
                <v-divider />
                <v-list-item
                  v-if="entry.status !== 'ARCHIVED'"
                  prepend-icon="mdi-archive-outline"
                  @click="confirmArchive(entry)"
                >
                  <v-list-item-title>{{ t('CreatorStudio.actions.archive') }}</v-list-item-title>
                </v-list-item>
                <v-list-item
                  v-if="entry.status === 'ARCHIVED'"
                  class="text-success"
                  prepend-icon="mdi-archive-arrow-up-outline"
                  @click="executeUnarchive(entry)"
                >
                  <v-list-item-title>{{ t('CreatorStudio.actions.unarchive') }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>
      </v-card>

      <!-- Pagination mobile -->
      <div v-if="totalPages > 1" class="d-flex justify-center mt-4">
        <v-pagination
          v-model="currentPage"
          density="compact"
          :length="totalPages"
          rounded
          @update:model-value="onPageChange"
        />
      </div>
    </div>

    <!-- ── Edit Dialog ─────────────────────────────────────── -->
    <v-dialog v-model="editDialog" :fullscreen="mobileView" max-width="600" persistent>
      <v-card>
        <v-toolbar color="transparent" density="compact">
          <v-toolbar-title class="text-body-1 font-weight-bold">
            {{ t('CreatorStudio.editEntry') }}
          </v-toolbar-title>
          <v-btn icon="mdi-close" @click="editDialog = false" />
        </v-toolbar>

        <v-card-text>
          <v-text-field
            v-model="editForm.title"
            class="mb-3"
            counter="200"
            :label="t('Upload.form.title')"
            :rules="titleRules"
            variant="outlined"
          />
          <v-textarea
            v-model="editForm.description"
            class="mb-3"
            counter="2000"
            :label="t('Upload.form.description')"
            rows="3"
            variant="outlined"
          />
          <v-switch
            v-model="editForm.isPaid"
            color="primary"
            :hint="t('Upload.form.isPaidHint')"
            :label="t('Upload.form.isPaid')"
            persistent-hint
          />
          <v-text-field
            v-if="editForm.isPaid"
            v-model="editForm.priceXlm"
            class="mt-3"
            :label="t('Upload.form.priceXlm')"
            prefix="XLM"
            step="0.01"
            type="number"
            variant="outlined"
          />
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">
            {{ t('Upload.actions.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            :loading="isSaving"
            variant="elevated"
            @click="saveEdit"
          >
            {{ t('Common.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Archive Confirmation Dialog ──────────────────────── -->
    <v-dialog v-model="archiveDialog" max-width="440">
      <v-card>
        <v-card-title class="text-h6">{{ t('CreatorStudio.archiveConfirm.title') }}</v-card-title>
        <v-card-text>
          {{ t('CreatorStudio.archiveConfirm.message', { title: entryToArchive?.title ?? '' }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="archiveDialog = false">
            {{ t('Upload.actions.cancel') }}
          </v-btn>
          <v-btn
            color="warning"
            :loading="isArchiving"
            variant="elevated"
            @click="executeArchive"
          >
            {{ t('CreatorStudio.actions.archive') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Upload Type Dialog ──────────────────────────────── -->
    <upload-type-dialog v-model="showUploadDialog" />

    <!-- ── Snackbar ────────────────────────────────────────── -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">{{ t('Common.close') }}</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
  import type { CreatorDashboardStats, CreatorEntryFilters, CreatorEntryModel } from '@/api/types/creator.types'
  import type { EntryStatus, EntryType } from '@/api/types/upload.types'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { api, ApiError } from '@/api/api'
  import UploadTypeDialog from '@/components/upload/UploadTypeDialog.vue'
  import { useAppStore } from '@/stores/app'

  const router = useRouter()
  const { t } = useI18n()
  const appStore = useAppStore()
  const { mobileView } = storeToRefs(appStore)

  // ── State ─────────────────────────────────────────────────

  const loading = ref(false)
  const error = ref<string | null>(null)
  const entries = ref<CreatorEntryModel[]>([])
  const totalElements = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const showUploadDialog = ref(false)
  const activeTab = ref<'active' | 'archived'>('active')

  const stats = reactive<CreatorDashboardStats>({
    totalEntries: 0,
    published: 0,
    drafts: 0,
    inReview: 0,
    rejected: 0,
    totalViews: 0,
    archived: 0,
    totalSales: 0,
  })

  const filters = reactive<{
    search: string
    status: EntryStatus | 'ALL'
    type: EntryType | 'ALL'
    sort: 'newest' | 'oldest' | 'title_asc' | 'title_desc'
  }>({
    search: '',
    status: 'ALL',
    type: 'ALL',
    sort: 'newest',
  })

  // Edit dialog
  const editDialog = ref(false)
  const editForm = reactive({
    id: '',
    title: '',
    description: '',
    isPaid: false,
    priceXlm: null as number | null,
  })
  const isSaving = ref(false)

  // Archive dialog
  const archiveDialog = ref(false)
  const entryToArchive = ref<CreatorEntryModel | null>(null)
  const isArchiving = ref(false)

  // Snackbar
  const snackbar = reactive({
    show: false,
    text: '',
    color: 'success' as string,
  })

  // ── Computed ──────────────────────────────────────────────

  const hasActiveFilters = computed(() =>
    (activeTab.value === 'active' && filters.status !== 'ALL') || filters.type !== 'ALL' || !!filters.search,
  )

  // ── Filter Options ────────────────────────────────────────

  const statusOptions = computed(() => [
    { title: t('CreatorStudio.allStatuses'), value: 'ALL' },
    { title: t('Upload.status.published'), value: 'PUBLISHED' },
    { title: t('Upload.status.draft'), value: 'DRAFT' },
    { title: t('Upload.status.inReview'), value: 'IN_REVIEW' },
    { title: t('Upload.status.approved'), value: 'APPROVED' },
    { title: t('Upload.status.rejected'), value: 'REJECTED' },
  ])

  const typeOptions = computed(() => [
    { title: t('CreatorStudio.allTypes'), value: 'ALL' },
    { title: t('Upload.type.video'), value: 'VIDEO' },
    { title: t('Upload.type.audio'), value: 'AUDIO' },
    { title: t('Upload.type.image'), value: 'IMAGE' },
    { title: t('Upload.type.resource'), value: 'RESOURCE' },
  ])

  const sortOptions = computed(() => [
    { title: t('CreatorStudio.sort.newest'), value: 'newest' },
    { title: t('CreatorStudio.sort.oldest'), value: 'oldest' },
    { title: t('CreatorStudio.sort.titleAZ'), value: 'title_asc' },
    { title: t('CreatorStudio.sort.titleZA'), value: 'title_desc' },
  ])

  // ── Validation ────────────────────────────────────────────

  const titleRules = [
    (v: string) => !!v?.trim() || t('Upload.form.titleRequired'),
    (v: string) => (v?.length ?? 0) <= 200 || t('Upload.form.titleMaxLength'),
  ]

  // ── Helpers ───────────────────────────────────────────────

  function getStatusColor (status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'warning',
      IN_REVIEW: 'info',
      APPROVED: 'primary',
      PUBLISHED: 'success',
      REJECTED: 'error',
      ARCHIVED: 'grey',
    }
    return map[status] ?? 'default'
  }

  function getStatusIcon (status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'mdi-pencil-outline',
      IN_REVIEW: 'mdi-clock-outline',
      APPROVED: 'mdi-check-outline',
      PUBLISHED: 'mdi-check-circle-outline',
      REJECTED: 'mdi-close-circle-outline',
      ARCHIVED: 'mdi-archive-outline',
    }
    return map[status] ?? 'mdi-help-circle-outline'
  }

  function getStatusLabel (status: string): string {
    const map: Record<string, string> = {
      ALL: t('CreatorStudio.allStatuses'),
      DRAFT: t('Upload.status.draft'),
      IN_REVIEW: t('Upload.status.inReview'),
      APPROVED: t('Upload.status.approved'),
      PUBLISHED: t('Upload.status.published'),
      REJECTED: t('Upload.status.rejected'),
      ARCHIVED: t('Upload.status.archived'),
    }
    return map[status] ?? status
  }

  function getTypeIcon (type: string): string {
    const normalized = type?.toUpperCase() ?? ''
    const map: Record<string, string> = {
      VIDEO: 'mdi-video-outline',
      AUDIO: 'mdi-music-note',
      IMAGE: 'mdi-image-outline',
      RESOURCE: 'mdi-file-document-outline',
    }
    return map[normalized] ?? 'mdi-file-outline'
  }

  function getTypeLabel (type: string): string {
    const normalized = type?.toLowerCase() ?? ''
    const map: Record<string, string> = {
      video: t('Upload.type.video'),
      audio: t('Upload.type.audio'),
      image: t('Upload.type.image'),
      resource: t('Upload.type.resource'),
      all: t('CreatorStudio.allTypes'),
    }
    return map[normalized] ?? type
  }

  function formatDate (dateStr: string): string {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  function formatNumber (num: number): string {
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return String(num)
  }

  function showToast (text: string, color = 'success') {
    snackbar.text = text
    snackbar.color = color
    snackbar.show = true
  }

  // ── Debounced fetch ───────────────────────────────────────

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  function debouncedFetch () {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      fetchEntries()
    }, 350)
  }

  // ── Data fetching ─────────────────────────────────────────

  function onTabChange () {
    currentPage.value = 1
    // Reset status filter when switching to archived tab
    if (activeTab.value === 'archived') {
      filters.status = 'ALL'
    }
    fetchEntries()
  }

  async function fetchEntries () {
    loading.value = true
    error.value = null

    try {
      const isArchivedTab = activeTab.value === 'archived'

      const filterParams: CreatorEntryFilters = {
        status: isArchivedTab
          ? 'ARCHIVED'
          : (filters.status === 'ALL' ? undefined : filters.status),
        type: filters.type === 'ALL' ? undefined : filters.type,
        search: filters.search || undefined,
        sort: filters.sort,
        page: currentPage.value - 1, // API is 0-based
        size: 20,
      }

      const page = await api.creator.getEntries(filterParams)
      entries.value = page.items
      totalElements.value = page.totalElements
      totalPages.value = page.totalPages
    } catch (error_) {
      console.error('[CreatorStudio] Failed to load entries:', error_)
      if (error_ instanceof ApiError) {
        error.value = `${error_.message} (HTTP ${error_.status})`
      } else {
        error.value = error_ instanceof Error ? error_.message : t('CreatorStudio.errorDescription')
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchStats () {
    try {
      const s = await api.creator.getDashboardStats()
      Object.assign(stats, s)
    } catch (error_) {
      console.error('[CreatorStudio] Failed to load stats:', error_)
    }
  }

  // ── Navigation ────────────────────────────────────────────

  function goToEntry (entry: CreatorEntryModel) {
    const typeRoutes: Record<string, string> = {
      VIDEO: 'watch',
      AUDIO: 'listen',
      IMAGE: 'view',
      RESOURCE: 'read',
      video: 'watch',
      audio: 'listen',
      image: 'view',
      resource: 'read',
    }
    const prefix = typeRoutes[entry.type] ?? 'view'
    router.push(`/${prefix}/${entry.id}`)
  }

  // ── Edit ──────────────────────────────────────────────────

  function openEditDialog (entry: CreatorEntryModel) {
    editForm.id = entry.id
    editForm.title = entry.title
    editForm.description = entry.description ?? ''
    editForm.isPaid = entry.isPaid
    editForm.priceXlm = entry.priceXlm ?? null
    editDialog.value = true
  }

  async function saveEdit () {
    if (!editForm.title.trim()) return

    isSaving.value = true
    try {
      await api.creator.updateMetadata(editForm.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        isPaid: editForm.isPaid,
        priceXlm: editForm.isPaid ? editForm.priceXlm : null,
      })
      showToast(t('CreatorStudio.editSuccess'))
      editDialog.value = false
      await fetchEntries()
    } catch (error_) {
      console.error('[CreatorStudio] Edit failed:', error_)
      showToast(t('CreatorStudio.editError'), 'error')
    } finally {
      isSaving.value = false
    }
  }

  // ── Submit for review ─────────────────────────────────────

  async function submitForReview (entry: CreatorEntryModel) {
    try {
      await api.upload.updateEntryStatus(entry.id, { status: 'IN_REVIEW' })
      showToast(t('Upload.success.submittedForReview'))
      await fetchEntries()
      await fetchStats()
    } catch (error_) {
      console.error('[CreatorStudio] Submit for review failed:', error_)
      showToast(t('Upload.errors.submitForReviewFailed'), 'error')
    }
  }

  // ── Archive / Unarchive ───────────────────────────────────

  function confirmArchive (entry: CreatorEntryModel) {
    entryToArchive.value = entry
    archiveDialog.value = true
  }

  async function executeArchive () {
    if (!entryToArchive.value) return

    isArchiving.value = true
    try {
      await api.creator.archiveEntry(entryToArchive.value.id)
      showToast(t('CreatorStudio.archiveSuccess'))
      archiveDialog.value = false
      entryToArchive.value = null
      await fetchEntries()
      await fetchStats()
    } catch (error_) {
      console.error('[CreatorStudio] Archive failed:', error_)
      showToast(t('CreatorStudio.archiveError'), 'error')
    } finally {
      isArchiving.value = false
    }
  }

  async function executeUnarchive (entry: CreatorEntryModel) {
    try {
      await api.creator.unarchiveEntry(entry.id)
      showToast(t('CreatorStudio.unarchiveSuccess'))
      await fetchEntries()
      await fetchStats()
    } catch (error_) {
      console.error('[CreatorStudio] Unarchive failed:', error_)
      showToast(t('CreatorStudio.unarchiveError'), 'error')
    }
  }

  // ── Pagination ────────────────────────────────────────────

  function onPageChange () {
    fetchEntries()
  }

  // ── Clear filters ─────────────────────────────────────────

  function clearFilters () {
    filters.search = ''
    filters.status = 'ALL'
    filters.type = 'ALL'
    filters.sort = 'newest'
    fetchEntries()
  }

  // ── Lifecycle ─────────────────────────────────────────────

  onMounted(() => {
    fetchEntries()
    fetchStats()
  })
</script>

<route lang="json">
{
  "path": "/creator-studio",
  "meta": { "requiresAuth": true }
}
</route>
