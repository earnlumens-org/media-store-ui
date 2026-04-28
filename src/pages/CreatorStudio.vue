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
      <v-col cols="6" lg="2" md="4" sm="4">
        <v-card
          class="pa-3 pa-md-4 text-center h-100 d-flex flex-column align-center justify-center"
          style="cursor: pointer;"
          variant="tonal"
          @click="router.push('/creator-studio/subscribers')"
        >
          <v-icon class="mb-1" color="deep-purple" size="28">mdi-account-group-outline</v-icon>
          <div class="text-h6 text-md-h5 font-weight-bold">{{ formatNumber(subscriberCount) }}</div>
          <div class="text-caption text-medium-emphasis">{{ t('CreatorStudio.stats.subscribers') }}</div>
          <div class="text-caption text-primary mt-1" style="font-size: 0.7rem;">
            {{ t('CreatorStudio.stats.viewDetails') }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Active / Archived / Collections Tabs ──────────── -->
    <v-tabs
      v-model="activeTab"
      class="mb-4 mb-md-6"
      color="primary"
      density="compact"
      :disabled="loading"
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

    <!-- ── Delete Collection Confirmation ──────────────── -->
    <v-dialog v-model="deleteCollDialog" max-width="440">
      <v-card>
        <v-card-title class="text-h6">{{ t('CreatorStudio.collections.deleteConfirm.title') }}</v-card-title>
        <v-card-text>
          {{ t('CreatorStudio.collections.deleteConfirm.message', { title: collToDelete?.title ?? '' }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteCollDialog = false">
            {{ t('Upload.actions.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            :loading="isDeletingColl"
            variant="elevated"
            @click="executeDeleteColl"
          >
            {{ t('CreatorStudio.collections.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Content (entries + collections merged) ──────── -->

    <!-- ── Filters + Search Bar ────────────────────────────── -->
    <v-card class="mb-4 mb-md-6 pa-3 pa-md-4" variant="outlined">
      <div class="d-flex flex-column flex-md-row align-start align-md-center ga-3">
        <!-- Search -->
        <v-text-field
          v-model="filters.search"
          class="flex-grow-1 search-field"
          clearable
          density="compact"
          hide-details
          :placeholder="t('CreatorStudio.searchPlaceholder')"
          prepend-inner-icon="mdi-magnify"
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
    <v-card v-else-if="studioItems.length === 0 && !loading" class="text-center pa-8 pa-md-12 bg-transparent" variant="flat">
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
            v-for="item in studioItems"
            :key="item.id"
            class="cursor-pointer"
            @click="goToItem(item)"
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
                    :alt="item.title"
                    :aspect-ratio="16 / 9"
                    cover
                    :src="item.thumbnailUrl || item.coverUrl"
                  >
                    <template #error>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <v-icon color="medium-emphasis" size="28">{{ getTypeIcon(item.type) }}</v-icon>
                      </div>
                    </template>
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                        <v-icon color="medium-emphasis" size="28">{{ getTypeIcon(item.type) }}</v-icon>
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
                    {{ item.title }}
                  </div>
                  <div v-if="item.description" class="text-caption text-medium-emphasis text-truncate">
                    {{ item.description }}
                  </div>
                </div>
              </div>
            </td>

            <!-- Status chip -->
            <td class="text-center text-no-wrap">
              <v-tooltip
                v-if="item.moderationFeedback && (item.status === 'REJECTED' || item.status === 'SUSPENDED')"
                location="top"
                max-width="320"
                :text="item.moderationFeedback"
              >
                <template #activator="{ props: tooltipProps }">
                  <v-chip
                    v-bind="tooltipProps"
                    :color="getStatusColor(item.status)"
                    size="small"
                    variant="tonal"
                  >
                    <v-icon size="14" start>{{ getStatusIcon(item.status) }}</v-icon>
                    {{ getStatusLabel(item.status) }}
                    <v-icon end size="14">mdi-information-outline</v-icon>
                  </v-chip>
                </template>
              </v-tooltip>
              <v-chip
                v-else
                :color="getStatusColor(item.status)"
                size="small"
                variant="tonal"
              >
                <v-icon size="14" start>{{ getStatusIcon(item.status) }}</v-icon>
                {{ getStatusLabel(item.status) }}
              </v-chip>
              <v-chip
                v-if="item.transcodingStatus"
                class="ml-1"
                :color="getTranscodingColor(item.transcodingStatus)"
                size="small"
                variant="tonal"
              >
                <v-progress-circular
                  v-if="isTranscodingInProgress(item.transcodingStatus)"
                  class="mr-1"
                  :indeterminate="true"
                  size="12"
                  width="2"
                />
                <v-icon v-else size="14" start>{{ getTranscodingIcon(item.transcodingStatus) }}</v-icon>
                {{ getTranscodingLabel(item.transcodingStatus) }}
              </v-chip>
            </td>

            <!-- Type -->
            <td class="text-center text-no-wrap">
              <v-chip size="small" variant="flat">
                <v-icon size="14" start>{{ getTypeIcon(item.type) }}</v-icon>
                {{ getTypeLabel(item.type) }}
              </v-chip>
            </td>

            <!-- Date -->
            <td class="text-center text-no-wrap">
              <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.createdAt) }}</span>
            </td>

            <!-- Price -->
            <td class="text-center">
              <span v-if="item.isPaid" class="text-body-2 font-weight-medium">
                {{ item.priceCurrency === 'USD' ? `$${item.priceUsd} USD` : `${item.priceXlm} XLM` }}
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
                  <v-list-item prepend-icon="mdi-eye-outline" @click="goToItem(item)">
                    <v-list-item-title>{{ t('CreatorStudio.actions.view') }}</v-list-item-title>
                  </v-list-item>
                  <!-- Moderation feedback -->
                  <v-list-item
                    v-if="item.moderationFeedback && (item.status === 'REJECTED' || item.status === 'SUSPENDED')"
                    class="text-warning"
                    prepend-icon="mdi-alert-circle-outline"
                    @click="openFeedbackDialog(item)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.viewFeedback') }}</v-list-item-title>
                  </v-list-item>
                  <!-- Entry-specific actions -->
                  <template v-if="item.kind === 'entry' && item._entry">
                    <v-list-item
                      v-if="item.status !== 'IN_REVIEW'"
                      prepend-icon="mdi-pencil-outline"
                      @click="openEditDialog(item._entry)"
                    >
                      <v-list-item-title>{{ t('CreatorStudio.actions.edit') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      v-if="item.status === 'DRAFT'"
                      prepend-icon="mdi-send-outline"
                      @click="submitForReview(item._entry)"
                    >
                      <v-list-item-title>{{ t('CreatorStudio.actions.submitReview') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      v-if="item.status === 'APPROVED'"
                      prepend-icon="mdi-publish"
                      @click="publishEntry(item._entry)"
                    >
                      <v-list-item-title>{{ t('CreatorStudio.actions.publish') }}</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item
                      v-if="item.status !== 'ARCHIVED'"
                      prepend-icon="mdi-archive-outline"
                      @click="confirmArchive(item._entry)"
                    >
                      <v-list-item-title>{{ t('CreatorStudio.actions.archive') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      v-if="item.status === 'ARCHIVED'"
                      class="text-success"
                      prepend-icon="mdi-archive-arrow-up-outline"
                      @click="executeUnarchive(item._entry)"
                    >
                      <v-list-item-title>{{ t('CreatorStudio.actions.unarchive') }}</v-list-item-title>
                    </v-list-item>
                  </template>
                  <!-- Collection-specific actions -->
                  <template v-if="item.kind === 'collection' && item._collection">
                    <v-list-item
                      v-if="item.status === 'DRAFT' || item.status === 'ARCHIVED'"
                      prepend-icon="mdi-publish"
                      @click="publishColl(item._collection)"
                    >
                      <v-list-item-title>{{ t('CreatorStudio.collections.publish') }}</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item
                      v-if="item.status !== 'ARCHIVED'"
                      prepend-icon="mdi-archive-outline"
                      @click="archiveColl(item._collection)"
                    >
                      <v-list-item-title>{{ t('CreatorStudio.actions.archive') }}</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      v-if="item.status === 'ARCHIVED'"
                      class="text-success"
                      prepend-icon="mdi-archive-arrow-up-outline"
                      @click="unarchiveColl(item._collection)"
                    >
                      <v-list-item-title>{{ t('CreatorStudio.actions.unarchive') }}</v-list-item-title>
                    </v-list-item>
                    <v-divider />
                    <v-list-item
                      v-if="item.status === 'DRAFT'"
                      class="text-error"
                      prepend-icon="mdi-delete-outline"
                      @click="confirmDeleteColl(item._collection)"
                    >
                      <v-list-item-title>{{ t('CreatorStudio.collections.delete') }}</v-list-item-title>
                    </v-list-item>
                  </template>
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
          {{ t('CreatorStudio.showingEntries', { count: studioItems.length, total: totalElements }) }}
        </span>
        <v-pagination
          v-if="totalPages > 1"
          v-model="currentPage"
          density="compact"
          :length="totalPages"
          rounded
          :total-visible="7"
          @update:model-value="onPageChange"
        />
      </div>
    </v-card>

    <!-- ── Content Cards (Mobile < md) ─────────────────────── -->
    <div v-else class="mobile-entries">
      <v-card
        v-for="item in studioItems"
        :key="item.id"
        class="mb-3"
        variant="outlined"
        @click="goToItem(item)"
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
              :alt="item.title"
              :aspect-ratio="16 / 9"
              cover
              :src="item.thumbnailUrl || item.coverUrl"
            >
              <template #error>
                <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                  <v-icon color="medium-emphasis" size="24">{{ getTypeIcon(item.type) }}</v-icon>
                </div>
              </template>
              <template #placeholder>
                <div class="d-flex align-center justify-center fill-height bg-surface-variant">
                  <v-icon color="medium-emphasis" size="24">{{ getTypeIcon(item.type) }}</v-icon>
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
              {{ item.title }}
            </div>
            <div class="d-flex flex-wrap align-center ga-1 mt-1">
              <v-tooltip
                v-if="item.moderationFeedback && (item.status === 'REJECTED' || item.status === 'SUSPENDED')"
                location="top"
                max-width="320"
                :text="item.moderationFeedback"
              >
                <template #activator="{ props: tooltipProps }">
                  <v-chip
                    v-bind="tooltipProps"
                    :color="getStatusColor(item.status)"
                    size="x-small"
                    variant="tonal"
                  >
                    {{ getStatusLabel(item.status) }}
                    <v-icon end size="12">mdi-information-outline</v-icon>
                  </v-chip>
                </template>
              </v-tooltip>
              <v-chip
                v-else
                :color="getStatusColor(item.status)"
                size="x-small"
                variant="tonal"
              >
                {{ getStatusLabel(item.status) }}
              </v-chip>
              <v-chip
                v-if="item.transcodingStatus"
                :color="getTranscodingColor(item.transcodingStatus)"
                size="x-small"
                variant="tonal"
              >
                {{ getTranscodingLabel(item.transcodingStatus) }}
              </v-chip>
              <v-chip size="x-small" variant="flat">
                {{ getTypeLabel(item.type) }}
              </v-chip>
              <span v-if="item.isPaid" class="text-caption font-weight-medium">
                {{ item.priceCurrency === 'USD' ? `$${item.priceUsd} USD` : `${item.priceXlm} XLM` }}
              </span>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ formatDate(item.createdAt) }}
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
                <v-list-item prepend-icon="mdi-eye-outline" @click="goToItem(item)">
                  <v-list-item-title>{{ t('CreatorStudio.actions.view') }}</v-list-item-title>
                </v-list-item>
                <!-- Moderation feedback -->
                <v-list-item
                  v-if="item.moderationFeedback && (item.status === 'REJECTED' || item.status === 'SUSPENDED')"
                  class="text-warning"
                  prepend-icon="mdi-alert-circle-outline"
                  @click="openFeedbackDialog(item)"
                >
                  <v-list-item-title>{{ t('CreatorStudio.actions.viewFeedback') }}</v-list-item-title>
                </v-list-item>
                <!-- Entry-specific actions -->
                <template v-if="item.kind === 'entry' && item._entry">
                  <v-list-item
                    v-if="item.status !== 'IN_REVIEW'"
                    prepend-icon="mdi-pencil-outline"
                    @click="openEditDialog(item._entry)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.edit') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="item.status === 'DRAFT'"
                    prepend-icon="mdi-send-outline"
                    @click="submitForReview(item._entry)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.submitReview') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="item.status === 'APPROVED'"
                    prepend-icon="mdi-publish"
                    @click="publishEntry(item._entry)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.publish') }}</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item
                    v-if="item.status !== 'ARCHIVED'"
                    prepend-icon="mdi-archive-outline"
                    @click="confirmArchive(item._entry)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.archive') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="item.status === 'ARCHIVED'"
                    class="text-success"
                    prepend-icon="mdi-archive-arrow-up-outline"
                    @click="executeUnarchive(item._entry)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.unarchive') }}</v-list-item-title>
                  </v-list-item>
                </template>
                <!-- Collection-specific actions -->
                <template v-if="item.kind === 'collection' && item._collection">
                  <v-list-item
                    v-if="item.status === 'DRAFT' || item.status === 'ARCHIVED'"
                    prepend-icon="mdi-publish"
                    @click="publishColl(item._collection)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.collections.publish') }}</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item
                    v-if="item.status !== 'ARCHIVED'"
                    prepend-icon="mdi-archive-outline"
                    @click="archiveColl(item._collection)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.archive') }}</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="item.status === 'ARCHIVED'"
                    class="text-success"
                    prepend-icon="mdi-archive-arrow-up-outline"
                    @click="unarchiveColl(item._collection)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.actions.unarchive') }}</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item
                    v-if="item.status === 'DRAFT'"
                    class="text-error"
                    prepend-icon="mdi-delete-outline"
                    @click="confirmDeleteColl(item._collection)"
                  >
                    <v-list-item-title>{{ t('CreatorStudio.collections.delete') }}</v-list-item-title>
                  </v-list-item>
                </template>
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
          :total-visible="5"
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
          <v-chip
            class="ml-2"
            :color="editStatusColor"
            label
            size="x-small"
            variant="tonal"
          >
            {{ editForm._status }}
          </v-chip>
          <v-spacer />
          <v-btn icon="mdi-close" @click="editDialog = false" />
        </v-toolbar>

        <v-card-text>
          <!-- Re-moderation warning -->
          <v-alert
            v-if="willTriggerReModeration"
            class="mb-4"
            color="warning"
            density="compact"
            icon="mdi-shield-refresh-outline"
            variant="tonal"
          >
            <div class="text-body-2 font-weight-medium">
              {{ t('CreatorStudio.editReviewWarningTitle') }}
            </div>
            <div class="text-caption mt-1">
              {{ t('CreatorStudio.editReviewWarningHint') }}
            </div>
          </v-alert>
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
          <v-textarea
            v-if="editForm._type === 'resource'"
            v-model="editForm.resourceContent"
            class="mb-3"
            :label="t('Upload.form.resourceContent')"
            :placeholder="t('Upload.form.resourceContentPlaceholder')"
            rows="8"
            variant="outlined"
          />
          <v-select
            v-model="editForm.contentLanguage"
            class="mb-3"
            :items="contentLanguageItems"
            :label="t('Upload.form.contentLanguage')"
            prepend-inner-icon="mdi-translate"
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
            v-model="editPrice"
            class="mt-3"
            :label="editForm.priceCurrency === 'USD' ? t('Upload.form.priceUsd') : t('Upload.form.priceXlm')"
            :prefix="editForm.priceCurrency"
            step="0.01"
            type="number"
            variant="outlined"
          >
            <template #append-inner>
              <v-btn-toggle
                v-model="editForm.priceCurrency"
                color="primary"
                density="compact"
                mandatory
                variant="outlined"
              >
                <v-btn size="small" value="XLM">XLM</v-btn>
                <v-btn size="small" value="USD">USD</v-btn>
              </v-btn-toggle>
            </template>
          </v-text-field>

          <!-- Wallet requirement for paid content -->
          <template v-if="editForm.isPaid">
            <!-- No wallet available (entry has no wallet and none connected) -->
            <v-alert
              v-if="!selectedSellerWallet && !walletStore.isConnected"
              class="mt-3"
              closable
              color="warning"
              icon="mdi-wallet-outline"
              variant="tonal"
            >
              <div class="text-body-2 font-weight-medium">
                {{ t('Upload.wallet.required') }}
              </div>
              <div class="text-caption mt-1">
                {{ t('Upload.wallet.requiredHint') }}
              </div>
              <v-btn
                class="mt-2"
                color="warning"
                size="small"
                variant="elevated"
                @click="connectWallet"
              >
                <v-icon class="me-1" size="small">mdi-wallet-plus</v-icon>
                {{ t('Upload.wallet.connect') }}
              </v-btn>
            </v-alert>

            <!-- Wallet connected but unfunded -->
            <v-alert
              v-else-if="isWalletUnfunded"
              class="mt-3"
              color="warning"
              icon="mdi-wallet-outline"
              variant="tonal"
            >
              <div class="text-body-2 font-weight-medium">
                {{ t('Upload.wallet.unfunded') }}
              </div>
              <div class="text-caption mt-1">
                {{ t('Upload.wallet.unfundedHint') }}
              </div>
              <v-btn
                class="mt-2"
                color="warning"
                size="small"
                variant="elevated"
                @click="router.push('/wallet')"
              >
                <v-icon class="me-1" size="small">mdi-wallet</v-icon>
                {{ t('Upload.wallet.goToWallet') }}
              </v-btn>
            </v-alert>

            <!-- Wallet connected and funded -->
            <v-alert
              v-else
              class="mt-3"
              color="success"
              icon="mdi-wallet-outline"
              variant="tonal"
            >
              <div class="text-body-2 font-weight-medium">
                {{ t('Upload.wallet.connected') }}
              </div>
              <v-select
                v-model="selectedSellerWallet"
                class="mt-2"
                density="compact"
                hide-details
                :items="walletItems"
                :label="t('Upload.wallet.sellerWallet')"
                variant="outlined"
              >
                <template #prepend-inner>
                  <v-icon color="success" size="small">mdi-check-circle</v-icon>
                </template>
              </v-select>
              <div class="text-caption text-medium-emphasis mt-1">
                {{ t('Upload.wallet.sellerWalletHint') }}
              </div>
              <v-btn
                class="mt-2"
                size="small"
                variant="text"
                @click="connectWallet"
              >
                <v-icon class="me-1" size="small">mdi-wallet-plus</v-icon>
                {{ t('Upload.wallet.addAnother') }}
              </v-btn>
            </v-alert>
          </template>

          <!-- Thumbnail -->
          <v-divider class="my-4" />
          <div class="text-subtitle-2 mb-1">
            {{ t('Upload.assets.thumbnail') }}
          </div>
          <div class="text-caption text-medium-emphasis mb-3">
            {{ t('Upload.assets.thumbnailHint') }}
          </div>
          <UploadAssetPicker
            v-model:file="editThumbnailFile"
            v-model:progress="editThumbnailProgress"
            :accept="THUMBNAIL_MIMES"
            :max-size="MAX_THUMBNAIL_SIZE"
          />

          <!-- Preview (only for paid content) -->
          <template v-if="editForm.isPaid">
            <v-divider class="my-4" />
            <div class="text-subtitle-2 mb-1">
              {{ t('Upload.assets.preview') }}
            </div>
            <div class="text-caption text-medium-emphasis mb-3">
              {{ t('Upload.assets.previewHint') }}
            </div>
            <UploadAssetPicker
              v-model:file="editPreviewFile"
              v-model:progress="editPreviewProgress"
              :accept="PREVIEW_MIMES"
              :max-size="MAX_PREVIEW_SIZE"
            />
          </template>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="editDialog = false">
            {{ t('Upload.actions.cancel') }}
          </v-btn>
          <v-btn
            :color="willTriggerReModeration ? 'warning' : 'primary'"
            :disabled="!canSaveEdit || !isEditDirty"
            :loading="isSaving || isUploading"
            :prepend-icon="willTriggerReModeration ? 'mdi-shield-refresh-outline' : 'mdi-content-save-outline'"
            variant="elevated"
            @click="saveEdit"
          >
            {{ willTriggerReModeration
              ? t('CreatorStudio.saveAndResubmit')
              : t('Common.save')
            }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Moderation Feedback Dialog ─────────────────────── -->
    <v-dialog v-model="feedbackDialog" max-width="480">
      <v-card>
        <v-card-title class="d-flex align-center ga-2">
          <v-icon :color="feedbackItem?.status === 'SUSPENDED' ? 'warning' : 'error'" size="20">
            mdi-alert-circle-outline
          </v-icon>
          {{ t('CreatorStudio.feedbackDialog.title') }}
        </v-card-title>
        <v-card-text>
          <v-alert
            :color="feedbackItem?.status === 'SUSPENDED' ? 'warning' : 'error'"
            density="compact"
            variant="tonal"
          >
            {{ feedbackItem?.moderationFeedback }}
          </v-alert>
          <div class="text-body-2 text-medium-emphasis mt-3">
            {{ t('CreatorStudio.feedbackDialog.hint') }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="feedbackDialog = false">
            {{ t('Common.close') }}
          </v-btn>
          <v-btn
            v-if="feedbackItem?.status === 'REJECTED' && feedbackItem?._entry"
            color="primary"
            prepend-icon="mdi-pencil-outline"
            variant="elevated"
            @click="feedbackDialog = false; openEditDialog(feedbackItem._entry)"
          >
            {{ t('CreatorStudio.feedbackDialog.editAndFix') }}
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
  import type { CollectionItemModel } from '@/api/types/collection.types'
  import type { CreatorDashboardStats, CreatorEntryModel, StudioItemModel } from '@/api/types/creator.types'
  import type { AssetKind, EntryStatus, EntryType } from '@/api/types/upload.types'
  import { storeToRefs } from 'pinia'
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useRouter } from 'vue-router'
  import { api, ApiError } from '@/api/api'
  import { MAX_PREVIEW_SIZE, MAX_THUMBNAIL_SIZE, PREVIEW_MIMES, THUMBNAIL_MIMES } from '@/api/types/upload.types'
  import UploadAssetPicker from '@/components/upload/UploadAssetPicker.vue'
  import UploadTypeDialog from '@/components/upload/UploadTypeDialog.vue'
  import { CONTENT_LANGUAGES } from '@/config/contentLanguages'
  import { accountExists } from '@/services/stellar'
  import { useAppStore } from '@/stores/app'
  import { useWalletStore } from '@/stores/wallet'

  const router = useRouter()
  const { t } = useI18n()
  const appStore = useAppStore()
  const { mobileView } = storeToRefs(appStore)
  const walletStore = useWalletStore()

  const contentLanguageItems = CONTENT_LANGUAGES.map(l => ({ value: l.value, title: l.title }))

  // ── StudioItem — backed by the unified server response ────

  // Re-use StudioItemModel directly; extend with optional originals for actions
  interface StudioItem extends StudioItemModel {
    _entry?: CreatorEntryModel
    _collection?: CollectionItemModel
  }

  // ── State ─────────────────────────────────────────────────

  const loading = ref(false)
  const error = ref<string | null>(null)
  const studioItems = ref<StudioItem[]>([])
  const totalElements = ref(0)
  const totalPages = ref(0)
  const currentPage = ref(1)
  const showUploadDialog = ref(false)
  const activeTab = ref<'active' | 'archived'>('active')

  // Collection delete dialog state
  const deleteCollDialog = ref(false)
  const collToDelete = ref<CollectionItemModel | null>(null)

  // Moderation feedback dialog state
  const feedbackDialog = ref(false)
  const feedbackItem = ref<StudioItem | null>(null)

  function openFeedbackDialog (item: StudioItem) {
    feedbackItem.value = item
    feedbackDialog.value = true
  }
  const isDeletingColl = ref(false)

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

  const subscriberCount = ref(0)

  const filters = reactive<{
    search: string
    status: EntryStatus | 'ALL'
    type: EntryType | 'COLLECTION' | 'ALL'
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
    priceUsd: null as number | null,
    priceCurrency: 'XLM' as 'XLM' | 'USD',
    contentLanguage: '' as string,
    resourceContent: '' as string,
    _status: '' as string,
    _type: '' as string,
  })
  const isSaving = ref(false)
  const isUploading = ref(false)
  const editThumbnailFile = ref<File | null>(null)
  const editThumbnailProgress = ref<number | null>(null)
  const editPreviewFile = ref<File | null>(null)
  const editPreviewProgress = ref<number | null>(null)
  const isWalletUnfunded = ref(false)
  const isCheckingWallet = ref(false)
  const selectedSellerWallet = ref('')
  const savedSellerWallet = ref('')

  // Build wallet items: connected wallets + entry's current wallet if not connected and still selected
  const walletItems = computed(() => {
    const saved = savedSellerWallet.value
    const currentLabel = t('Upload.wallet.currentWallet')
    const connected = walletStore.wallets.map(w => {
      const abbr = `${w.providerName} — ${w.address.slice(0, 7)}...${w.address.slice(-7)}`
      return {
        value: w.address,
        title: w.address === saved ? `${abbr} (${currentLabel})` : abbr,
      }
    })
    const selected = selectedSellerWallet.value
    if (selected && !connected.some(w => w.value === selected)) {
      const abbr = `${selected.slice(0, 7)}...${selected.slice(-7)}`
      connected.unshift({
        value: selected,
        title: selected === saved ? `${abbr} (${currentLabel})` : abbr,
      })
    }
    return connected
  })

  // Default to active wallet when wallets change and nothing is selected
  watch(
    () => walletStore.activeAddress,
    addr => {
      if (addr && !selectedSellerWallet.value) {
        selectedSellerWallet.value = addr
      }
    },
  )

  // Check if selected wallet is funded whenever it changes or paid toggle changes
  watch(
    () => [selectedSellerWallet.value, editForm.isPaid] as const,
    async ([address, isPaid]) => {
      if (!address || !isPaid) {
        isWalletUnfunded.value = false
        return
      }
      isCheckingWallet.value = true
      try {
        isWalletUnfunded.value = !(await accountExists(address))
      } catch {
        isWalletUnfunded.value = false
      } finally {
        isCheckingWallet.value = false
      }
    },
    { immediate: true },
  )

  const canSaveEdit = computed(() => {
    if (!editForm.title.trim()) return false
    if (editForm.isPaid && !selectedSellerWallet.value) return false
    if (editForm.isPaid && isWalletUnfunded.value) return false
    return true
  })

  // Track original form values to detect dirty state
  const editOriginal = reactive({
    title: '',
    description: '',
    isPaid: false,
    priceXlm: null as number | null,
    priceUsd: null as number | null,
    priceCurrency: 'XLM' as string,
    contentLanguage: '',
    resourceContent: '',
  })

  const isEditDirty = computed(() => {
    if (editThumbnailFile.value || editPreviewFile.value) return true
    return editForm.title !== editOriginal.title
      || editForm.description !== editOriginal.description
      || editForm.isPaid !== editOriginal.isPaid
      || editForm.priceXlm !== editOriginal.priceXlm
      || editForm.priceUsd !== editOriginal.priceUsd
      || editForm.priceCurrency !== editOriginal.priceCurrency
      || editForm.contentLanguage !== editOriginal.contentLanguage
      || editForm.resourceContent !== editOriginal.resourceContent
  })

  const willTriggerReModeration = computed(() => {
    const s = editForm._status
    return s !== 'DRAFT' && s !== 'IN_REVIEW' && s !== 'ARCHIVED'
  })

  const editStatusColor = computed(() => {
    switch (editForm._status) {
      case 'PUBLISHED': { return 'success'
      }
      case 'APPROVED': { return 'info'
      }
      case 'REJECTED': { return 'error'
      }
      case 'SUSPENDED': { return 'warning'
      }
      case 'IN_REVIEW': { return 'warning'
      }
      case 'DRAFT': { return 'grey'
      }
      default: { return 'grey'
      }
    }
  })

  // Computed price that maps to the correct field based on currency
  const editPrice = computed({
    get: () => editForm.priceCurrency === 'USD' ? editForm.priceUsd : editForm.priceXlm,
    set: (val: number | null) => {
      if (editForm.priceCurrency === 'USD') {
        editForm.priceUsd = val
      } else {
        editForm.priceXlm = val
      }
    },
  })

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
    { title: t('Upload.type.collection'), value: 'COLLECTION' },
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

  function getTranscodingColor (status: string): string {
    const map: Record<string, string> = {
      PENDING: 'info',
      DISPATCHED: 'info',
      PROCESSING: 'info',
      FAILED: 'error',
      DEAD: 'error',
    }
    return map[status] ?? 'default'
  }

  function getTranscodingIcon (status: string): string {
    const map: Record<string, string> = {
      PENDING: 'mdi-clock-outline',
      DISPATCHED: 'mdi-send-outline',
      FAILED: 'mdi-alert-circle-outline',
      DEAD: 'mdi-close-circle-outline',
    }
    return map[status] ?? 'mdi-help-circle-outline'
  }

  function getTranscodingLabel (status: string): string {
    const map: Record<string, string> = {
      PENDING: t('CreatorStudio.transcoding.pending'),
      DISPATCHED: t('CreatorStudio.transcoding.dispatched'),
      PROCESSING: t('CreatorStudio.transcoding.processing'),
      FAILED: t('CreatorStudio.transcoding.failed'),
      DEAD: t('CreatorStudio.transcoding.dead'),
    }
    return map[status] ?? status
  }

  function isTranscodingInProgress (status: string): boolean {
    return status === 'PENDING' || status === 'DISPATCHED' || status === 'PROCESSING'
  }

  function getTypeIcon (type: string): string {
    const normalized = type?.toUpperCase() ?? ''
    const map: Record<string, string> = {
      VIDEO: 'mdi-video-outline',
      AUDIO: 'mdi-music-note',
      IMAGE: 'mdi-image-outline',
      RESOURCE: 'mdi-file-document-outline',
      COLLECTION: 'mdi-folder-multiple',
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
      collection: t('Upload.type.collection'),
      all: t('CreatorStudio.allTypes'),
    }
    return map[normalized] ?? type
  }

  async function connectWallet () {
    try {
      const result = await walletStore.connect()
      if (result) {
        selectedSellerWallet.value = result.address
        showToast(t('Upload.wallet.connectSuccess'))
      }
    } catch (error_) {
      console.error('Wallet connection failed:', error_)
      showToast(t('Upload.wallet.connectError'), 'error')
    }
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

  const STUDIO_PAGE_SIZE = 20

  async function fetchEntries () {
    loading.value = true
    error.value = null

    try {
      const isArchivedTab = activeTab.value === 'archived'

      const result = await api.creator.getStudioItems({
        status: isArchivedTab
          ? 'ARCHIVED'
          : (filters.status === 'ALL' ? undefined : filters.status),
        type: filters.type === 'ALL' ? undefined : filters.type,
        search: filters.search || undefined,
        sort: filters.sort,
        page: currentPage.value - 1, // server is 0-based
        size: STUDIO_PAGE_SIZE,
      })

      studioItems.value = result.items.map(item => {
        const si: StudioItem = { ...item }
        if (item.kind === 'entry') {
          si._entry = {
            id: item.id,
            type: (item.type?.toUpperCase() ?? 'RESOURCE') as CreatorEntryModel['type'],
            title: item.title,
            description: item.description,
            status: item.status as CreatorEntryModel['status'],
            thumbnailUrl: item.thumbnailUrl,
            isPaid: item.isPaid,
            priceXlm: item.priceXlm,
            priceUsd: item.priceUsd,
            priceCurrency: item.priceCurrency as 'XLM' | 'USD' | undefined,
            contentLanguage: item.contentLanguage,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            publishedAt: item.publishedAt,
            transcodingStatus: item.transcodingStatus,
            sellerWallet: item.sellerWallet,
            moderationFeedback: item.moderationFeedback,
            resourceContent: item.resourceContent,
          }
        } else {
          si._collection = {
            id: item.id,
            title: item.title,
            description: item.description,
            status: item.status,
            coverUrl: item.coverUrl,
            isPaid: item.isPaid,
            priceXlm: item.priceXlm,
            priceUsd: item.priceUsd,
            priceCurrency: item.priceCurrency,
            itemCount: item.itemCount,
            publishedAt: item.publishedAt ?? '',
            locked: false,
            unlocked: true,
          } as CollectionItemModel
        }
        return si
      })
      totalElements.value = result.totalElements
      totalPages.value = result.totalPages
      if (currentPage.value > totalPages.value && totalPages.value > 0) {
        currentPage.value = 1
      }
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

  function goToItem (item: StudioItem) {
    if (item.kind === 'collection' && item._collection) {
      router.push(`/collection/${item._collection.id}`)
      return
    }
    if (!item._entry) return

    // Only published entries have a public page
    if (item.status === 'PUBLISHED') {
      goToEntry(item._entry)
      return
    }
    // Rejected/suspended with feedback → show moderation feedback
    if (
      item.moderationFeedback
      && (item.status === 'REJECTED' || item.status === 'SUSPENDED')
    ) {
      openFeedbackDialog(item)
      return
    }
    // In review → no action (entry is locked while under review)
    if (item.status === 'IN_REVIEW') return
    // Draft / approved / other → open edit dialog
    openEditDialog(item._entry)
  }

  // ── Edit ──────────────────────────────────────────────────

  function openEditDialog (entry: CreatorEntryModel) {
    editForm.id = entry.id
    editForm.title = entry.title
    editForm.description = entry.description ?? ''
    editForm.isPaid = entry.isPaid
    editForm.priceXlm = entry.priceXlm ?? null
    editForm.priceUsd = entry.priceUsd ?? null
    editForm.priceCurrency = entry.priceCurrency ?? 'XLM'
    editForm.contentLanguage = entry.contentLanguage ?? ''
    editForm.resourceContent = entry.resourceContent ?? ''
    editForm._status = entry.status
    editForm._type = typeof entry.type === 'string' ? entry.type.toLowerCase() : ''
    selectedSellerWallet.value = entry.sellerWallet ?? walletStore.activeAddress ?? ''
    savedSellerWallet.value = entry.sellerWallet ?? ''
    editThumbnailFile.value = null
    editThumbnailProgress.value = null
    editPreviewFile.value = null
    editPreviewProgress.value = null

    // Snapshot for dirty detection
    editOriginal.title = editForm.title
    editOriginal.description = editForm.description
    editOriginal.isPaid = editForm.isPaid
    editOriginal.priceXlm = editForm.priceXlm
    editOriginal.priceUsd = editForm.priceUsd
    editOriginal.priceCurrency = editForm.priceCurrency
    editOriginal.contentLanguage = editForm.contentLanguage
    editOriginal.resourceContent = editForm.resourceContent

    editDialog.value = true
  }

  async function uploadEditAsset (entryId: string, file: File, kind: AssetKind, progressRef: typeof editThumbnailProgress) {
    const initResp = await api.upload.initUpload({
      entryId,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
      kind,
      fileSizeBytes: file.size,
    })
    await api.upload.uploadToR2(initResp.presignedUrl, file, pct => {
      progressRef.value = pct
    })
    const meta = await extractImageMeta(file)
    await api.upload.finalizeUpload({
      uploadId: initResp.uploadId,
      entryId,
      r2Key: initResp.r2Key,
      contentType: file.type,
      fileName: file.name,
      fileSizeBytes: file.size,
      kind,
      widthPx: meta.widthPx,
      heightPx: meta.heightPx,
      durationSec: null,
      bitrateBps: null,
    })
  }

  async function extractImageMeta (file: File): Promise<{ widthPx: number | null, heightPx: number | null }> {
    const mime = file.type || ''
    if (mime.startsWith('image/')) {
      try {
        const url = URL.createObjectURL(file)
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.addEventListener('load', () => resolve())
          img.addEventListener('error', () => reject(new Error('Failed')))
          img.src = url
        })
        const result = { widthPx: img.naturalWidth, heightPx: img.naturalHeight }
        URL.revokeObjectURL(url)
        return result
      } catch { /* ignore */ }
    }
    return { widthPx: null, heightPx: null }
  }

  async function saveEdit () {
    if (!editForm.title.trim()) return

    isSaving.value = true
    try {
      await api.creator.updateMetadata(editForm.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        isPaid: editForm.isPaid,
        priceXlm: editForm.isPaid && editForm.priceCurrency === 'XLM' ? editForm.priceXlm : null,
        priceUsd: editForm.isPaid && editForm.priceCurrency === 'USD' ? editForm.priceUsd : null,
        priceCurrency: editForm.isPaid ? editForm.priceCurrency : null,
        sellerWallet: editForm.isPaid ? selectedSellerWallet.value : null,
        resourceContent: editForm._type === 'resource' ? (editForm.resourceContent.trim() || null) : undefined,
        contentLanguage: editForm.contentLanguage || undefined,
      })

      // Upload new thumbnail / preview if selected
      if (editThumbnailFile.value || editPreviewFile.value) {
        isUploading.value = true
        if (editThumbnailFile.value) {
          await uploadEditAsset(editForm.id, editThumbnailFile.value, 'THUMBNAIL', editThumbnailProgress)
        }
        if (editPreviewFile.value) {
          await uploadEditAsset(editForm.id, editPreviewFile.value, 'PREVIEW', editPreviewProgress)
        }
        isUploading.value = false
      }

      showToast(willTriggerReModeration.value
        ? t('CreatorStudio.editResubmittedSuccess')
        : t('CreatorStudio.editSuccess'))
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

  // ── Publish entry ─────────────────────────────────────────

  async function publishEntry (entry: CreatorEntryModel) {
    try {
      await api.upload.updateEntryStatus(entry.id, { status: 'PUBLISHED' })
      showToast(t('CreatorStudio.actions.publishSuccess'))
      await fetchEntries()
      await fetchStats()
    } catch (error_) {
      console.error('[CreatorStudio] Publish failed:', error_)
      showToast(t('CreatorStudio.actions.publishError'), 'error')
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

  // ── Collections ───────────────────────────────────────────

  async function publishColl (coll: CollectionItemModel) {
    try {
      await api.collections.publish(coll.id)
      showToast(t('CreatorStudio.collections.publishSuccess'))
      await fetchEntries()
    } catch (error_) {
      console.error('[CreatorStudio] Publish collection failed:', error_)
      const msg = error_ instanceof ApiError ? error_.message : t('CreatorStudio.collections.publishError')
      showToast(msg, 'error')
    }
  }

  async function archiveColl (coll: CollectionItemModel) {
    try {
      await api.collections.archive(coll.id)
      showToast(t('CreatorStudio.archiveSuccess'))
      await fetchEntries()
    } catch (error_) {
      console.error('[CreatorStudio] Archive collection failed:', error_)
      showToast(t('CreatorStudio.archiveError'), 'error')
    }
  }

  async function unarchiveColl (coll: CollectionItemModel) {
    try {
      await api.collections.unarchive(coll.id)
      showToast(t('CreatorStudio.unarchiveSuccess'))
      await fetchEntries()
    } catch (error_) {
      console.error('[CreatorStudio] Unarchive collection failed:', error_)
      showToast(t('CreatorStudio.unarchiveError'), 'error')
    }
  }

  function confirmDeleteColl (coll: CollectionItemModel) {
    collToDelete.value = coll
    deleteCollDialog.value = true
  }

  async function executeDeleteColl () {
    if (!collToDelete.value) return
    isDeletingColl.value = true
    try {
      await api.collections.delete(collToDelete.value.id)
      showToast(t('CreatorStudio.collections.deleteSuccess'))
      deleteCollDialog.value = false
      collToDelete.value = null
      await fetchEntries()
    } catch (error_) {
      console.error('[CreatorStudio] Delete collection failed:', error_)
      showToast(t('CreatorStudio.collections.deleteError'), 'error')
    } finally {
      isDeletingColl.value = false
    }
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
    // Fetch subscriber count in parallel
    api.subscriptions.mySubscriberCount()
      .then(count => {
        subscriberCount.value = count
      })
      .catch(() => { /* silently fail */ })
  })
</script>

<route lang="json">
{
  "path": "/creator-studio",
  "meta": { "requiresAuth": true }
}
</route>

<style scoped>
.search-field {
  width: 100%;
}

@media (min-width: 960px) {
  .search-field {
    max-width: 400px;
  }
}
</style>
