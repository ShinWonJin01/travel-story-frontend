<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getStoredMember } from '@/api/auth'
import { ApiError } from '@/api/http'
import {
  getTripDetail,
  getTripParticipants,
  getTripPhotos,
  type Trip,
} from '@/api/trips'

import ParticipantManagementModal from '@/components/trips/detail/ParticipantManagementModal.vue'
import TripAiDiaryTab from '@/components/trips/detail/TripAiDiaryTab.vue'
import TripDetailSidebar from '@/components/trips/detail/TripDetailSidebar.vue'
import TripEditModal from '@/components/trips/detail/TripEditModal.vue'
import TripMapTab from '@/components/trips/detail/TripMapTab.vue'
import TripMobileTabs from '@/components/trips/detail/TripMobileTabs.vue'
import TripOverviewTab from '@/components/trips/detail/TripOverviewTab.vue'
import TripPhotosTab from '@/components/trips/detail/TripPhotosTab.vue'
import TripTimelineTab from '@/components/trips/detail/TripTimelineTab.vue'

import { useTripAiDiary } from '@/composables/trips/useTripAiDiary'
import { useTripImages } from '@/composables/trips/useTripImages'
import { useTripManagement } from '@/composables/trips/useTripManagement'
import { useTripParticipants } from '@/composables/trips/useTripParticipants'
import { useTripPhotos } from '@/composables/trips/useTripPhotos'

type TripTab = 'overview' | 'timeline' | 'photos' | 'map' | 'ai-diary'

type CurrentLocationResult =
  | {
      success: true
      latitude: number
      longitude: number
    }
  | {
      success: false
      reason:
        | 'insecure'
        | 'unsupported'
        | 'permission-denied'
        | 'unavailable'
        | 'timeout'
        | 'low-accuracy'
      accuracy?: number
    }

const validTabs: TripTab[] = [
  'overview',
  'timeline',
  'photos',
  'map',
  'ai-diary',
]

const route = useRoute()
const router = useRouter()
const currentMember = getStoredMember()

const trip = ref<Trip | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')
const photoInputRef = ref<HTMLInputElement | null>(null)

const tripId = computed<number | null>(() => {
  const routeId = Array.isArray(route.params.id)
    ? route.params.id[0]
    : route.params.id

  const parsedId = Number(routeId)

  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null
})

const isOwner = computed(() => currentMember?.id === trip.value?.ownerId)

const {
  coverImageUrl,
  tripPhotoImageUrls,
  participantProfileImageUrls,
  loadCoverImage,
  loadTripPhotoImageUrl,
  loadTripPhotoImageUrls,
  loadParticipantProfileImageUrls,
  removeTripPhotoImageUrl,
  revokeCoverImageUrl,
  revokeTripPhotoImageUrls,
  revokeParticipantProfileImageUrls,
} = useTripImages(tripId)

const {
  tripPhotos,
  timelineGroups,
  photos,
  mapPhotos,
  uploadPhotos,
  removePhotos,
  updatePhotoMemo,
  updatePhotoTakenAt,
  updatePhotoLocation,
  deletePhotoLocation,
} = useTripPhotos({
  tripId,
  currentMemberId: currentMember?.id,
  isOwner,
  tripPhotoImageUrls,
  loadTripPhotoImageUrl,
  removeTripPhotoImageUrl,
})

const {
  tripParticipants,
  participants,
  participantCount,
  visibleParticipants,
  remainingParticipantCount,
  isParticipantModalOpen,
  inviteNickname,
  isInviting,
  invitationMessage,
  invitationErrorMessage,
  openParticipantModal,
  closeParticipantModal,
  sendInvitation,
} = useTripParticipants({
  tripId,
  participantProfileImageUrls,
})

const {
  isTripEditModalOpen,
  isSavingTrip,
  tripEditErrorMessage,
  openTripEdit,
  closeTripEdit,
  updateCurrentTrip,
  deleteCurrentTrip,
  leaveCurrentTrip,
} = useTripManagement({
  tripId,
  trip,
})

const {
  aiDiary,
  isGeneratingAiDiary,
  loadAiDiary,
  generateAiDiary,
  clearAiDiary,
} = useTripAiDiary({
  tripId,
})

const tripTitle = computed(() => trip.value?.title ?? '여행 상세')
const tripDestination = computed(() => trip.value?.destination ?? '')
const tripDescription = computed(() => trip.value?.description.trim() ?? '')

const activeTab = computed<TripTab>(() => {
  const tab = route.query.tab

  return typeof tab === 'string' && validTabs.includes(tab as TripTab)
    ? (tab as TripTab)
    : 'overview'
})

const showMobilePhotoButton = computed(() =>
  ['overview', 'timeline', 'photos'].includes(activeTab.value),
)

const formatDate = (date: string) => date.replaceAll('-', '.')

const toUtcTimestamp = (date: string) => {
  const [yearText, monthText, dayText] = date.split('-')

  if (!yearText || !monthText || !dayText) return null

  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null
  }

  return Date.UTC(year, month - 1, day)
}

const tripPeriod = computed(() => {
  if (!trip.value) return ''

  const startDate = formatDate(trip.value.startDate)

  return trip.value.endDate
    ? `${startDate} - ${formatDate(trip.value.endDate)}`
    : `${startDate} - 종료일 미정`
})

const tripDuration = computed(() => {
  if (!trip.value) return ''
  if (!trip.value.endDate) return '종료일 미정'

  const startTimestamp = toUtcTimestamp(trip.value.startDate)
  const endTimestamp = toUtcTimestamp(trip.value.endDate)

  if (startTimestamp === null || endTimestamp === null) return '-'

  const millisecondsPerDay = 24 * 60 * 60 * 1000
  const nights = Math.max(
    Math.round((endTimestamp - startTimestamp) / millisecondsPerDay),
    0,
  )

  return `${nights}박 ${nights + 1}일`
})

const resetTripState = () => {
  revokeCoverImageUrl()
  revokeTripPhotoImageUrls()
  revokeParticipantProfileImageUrls()

  trip.value = null
  tripParticipants.value = []
  tripPhotos.value = []
  clearAiDiary()
}

const loadTrip = async () => {
  const id = tripId.value

  if (id === null) {
    resetTripState()
    errorMessage.value = '올바르지 않은 여행 주소입니다.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const [tripDetail, participantItems, photoItems] = await Promise.all([
      getTripDetail(id),
      getTripParticipants(id),
      getTripPhotos(id),
    ])

    trip.value = tripDetail
    tripParticipants.value = participantItems
    tripPhotos.value = photoItems

    await Promise.all([
      loadAiDiary(),
      loadTripPhotoImageUrls(photoItems),
      loadParticipantProfileImageUrls(participantItems),
    ])
  } catch (error) {
    resetTripState()

    errorMessage.value =
      error instanceof ApiError
        ? error.message
        : '여행 정보를 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

const selectTab = (tab: TripTab) => {
  void router.replace({
    name: 'trip-detail',
    params: { id: route.params.id },
    query: tab === 'overview' ? {} : { tab },
  })
}

const openPhotoUpload = () => {
  photoInputRef.value?.click()
}

const getCurrentLocalDateTime = () => {
  const now = new Date()

  const pad = (value: number) =>
    String(value).padStart(2, '0')

  return [
    now.getFullYear(),
    '-',
    pad(now.getMonth() + 1),
    '-',
    pad(now.getDate()),
    'T',
    pad(now.getHours()),
    ':',
    pad(now.getMinutes()),
    ':',
    pad(now.getSeconds()),
  ].join('')
}

const getCurrentLocation = () =>
  new Promise<CurrentLocationResult>((resolve) => {
    if (!window.isSecureContext) {
      resolve({ success: false, reason: 'insecure' })
      return
    }

    if (!navigator.geolocation) {
      resolve({ success: false, reason: 'unsupported' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords

        if (accuracy > 100) {
          resolve({
            success: false,
            reason: 'low-accuracy',
            accuracy,
          })
          return
        }

        resolve({
          success: true,
          latitude,
          longitude,
        })
      },
      (error) => {
        if (error.code === 1) {
          resolve({ success: false, reason: 'permission-denied' })
          return
        }

        if (error.code === 2) {
          resolve({ success: false, reason: 'unavailable' })
          return
        }

        resolve({ success: false, reason: 'timeout' })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  })

const getLocationErrorMessage = (result: Extract<
  CurrentLocationResult,
  { success: false }
>) => {
  switch (result.reason) {
    case 'insecure':
      return '현재 개발 환경은 HTTP이므로 현재 위치를 사용할 수 없습니다.\nHTTPS 환경에서는 위치 기능을 사용할 수 있습니다.\n사진은 위치 정보 없이 등록됩니다.'
    case 'permission-denied':
      return '위치 권한이 허용되지 않았습니다.\n브라우저의 위치 권한을 확인해 주세요.\n사진은 위치 정보 없이 등록됩니다.'
    case 'low-accuracy':
      return `현재 위치의 정확도가 낮아 사용할 수 없습니다. (${Math.round(result.accuracy ?? 0)}m)\n사진은 위치 정보 없이 등록됩니다.`
    case 'timeout':
      return '현재 위치를 확인하는 데 시간이 너무 오래 걸렸습니다.\n사진은 위치 정보 없이 등록됩니다.'
    default:
      return '현재 위치를 가져올 수 없습니다.\n사진은 위치 정보 없이 등록됩니다.'
  }
}

const handlePhotoSelect = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const files = Array.from(input.files)

  try {
    const uploadedPhotos = await uploadPhotos(files)
    const photosWithoutLocation = uploadedPhotos.filter(
      (photo) => photo.latitude === null || photo.longitude === null,
    )

    if (photosWithoutLocation.length > 0) {
      const useCurrentLocation = window.confirm(
        photosWithoutLocation.length === 1
          ? '사진에 위치 정보가 없습니다.\n현재 위치를 사용하시겠습니까?'
          : `사진 ${photosWithoutLocation.length}장에 위치 정보가 없습니다.\n현재 위치를 사용하시겠습니까?`,
      )

      if (useCurrentLocation) {
        const currentLocation = await getCurrentLocation()

        if (currentLocation.success) {
          const currentTakenAt =
            getCurrentLocalDateTime()

          for (const photo of photosWithoutLocation) {
            await updatePhotoLocation(
              photo.id,
              currentLocation.latitude,
              currentLocation.longitude,
              null,
            )

            if (photo.takenAt === null) {
              await updatePhotoTakenAt(
                photo.id,
                currentTakenAt,
              )
            }
          }
        } else {
          window.alert(getLocationErrorMessage(currentLocation))
        }
      }
    }

    selectTab('photos')

    window.alert(
      files.length === 1
        ? '사진을 등록했습니다.'
        : `사진 ${files.length}장을 등록했습니다.`,
    )
  } catch (error) {
    window.alert(
      error instanceof ApiError
        ? error.message
        : '사진을 등록하지 못했습니다.',
    )
  } finally {
    input.value = ''
  }
}

const handleDeletePhotos = async (photoIds: number[]) => {
  if (
    photoIds.length === 0 ||
    !window.confirm(`선택한 사진 ${photoIds.length}장을 삭제하시겠습니까?`)
  ) {
    return
  }

  try {
    await removePhotos(photoIds)
  } catch (error) {
    window.alert(
      error instanceof ApiError
        ? error.message
        : '선택한 사진을 삭제하지 못했습니다.',
    )

    await loadTrip()
  }
}

const handleUpdatePhotoMemo = async (photoId: number, memo: string) => {
  try {
    await updatePhotoMemo(photoId, memo)
  } catch (error) {
    window.alert(
      error instanceof ApiError
        ? error.message
        : '사진 메모를 저장하지 못했습니다.',
    )
  }
}

const handleUpdatePhotoTakenAt = async (
  photoId: number,
  takenAt: string | null,
) => {
  try {
    await updatePhotoTakenAt(photoId, takenAt)
  } catch (error) {
    window.alert(
      error instanceof ApiError
        ? error.message
        : '사진 촬영시간을 수정하지 못했습니다.',
    )
  }
}

const handleUpdatePhotoLocation = async (
  photoId: number,
  latitude: number,
  longitude: number,
  locationName: string | null,
) => {
  try {
    await updatePhotoLocation(
      photoId,
      latitude,
      longitude,
      locationName,
    )
  } catch (error) {
    window.alert(
      error instanceof ApiError
        ? error.message
        : '사진 위치를 수정하지 못했습니다.',
    )
  }
}

const handleDeletePhotoLocation = async (
  photoId: number,
) => {
  try {
    await deletePhotoLocation(photoId)
  } catch (error) {
    window.alert(
      error instanceof ApiError
        ? error.message
        : '사진 위치를 삭제하지 못했습니다.',
    )
  }
}

const handleDeleteTrip = async () => {
  if (
    !window.confirm(
      '여행을 삭제하시겠습니까?\n삭제한 여행은 복구할 수 없습니다.',
    )
  ) {
    return
  }

  try {
    const deleted = await deleteCurrentTrip()
    if (deleted) await router.push('/trips')
  } catch (error) {
    window.alert(
      error instanceof ApiError
        ? error.message
        : '여행을 삭제하지 못했습니다.',
    )
  }
}

const handleLeaveTrip = async () => {
  if (
    !window.confirm(
      '이 여행에서 나가시겠습니까?\n나간 뒤에는 다시 초대를 받아야 참여할 수 있습니다.',
    )
  ) {
    return
  }

  try {
    const left = await leaveCurrentTrip()
    if (left) await router.push('/trips')
  } catch (error) {
    window.alert(
      error instanceof ApiError
        ? error.message
        : '여행에서 나가지 못했습니다.',
    )
  }
}

const handleGenerateAiDiary = async () => {
  try {
    await generateAiDiary()
  } catch (error) {
    window.alert(
      error instanceof ApiError
        ? error.message
        : 'AI 여행기를 생성하지 못했습니다.',
    )
  }
}

watch(
  () => route.params.id,
  () => {
    void loadTrip()
  },
  { immediate: true },
)

watch(
  [tripId, () => trip.value?.coverImagePath],
  () => {
    void loadCoverImage(trip.value?.coverImagePath)
  },
)
</script>

<template>
  <main class="trip-detail-page">
    <section v-if="isLoading" class="detail-state-card">
      <span class="detail-state-spinner"></span>
      <p>여행 정보를 불러오는 중입니다.</p>
    </section>

    <section
      v-else-if="errorMessage"
      class="detail-state-card detail-error-card"
    >
      <div class="detail-error-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
      </div>

      <h1>여행 정보를 불러오지 못했습니다.</h1>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="loadTrip">다시 시도</button>
    </section>

    <div v-else-if="trip" class="detail-layout">
      <TripDetailSidebar
        :trip-title="tripTitle"
        :active-tab="activeTab"
        @change="selectTab"
      />

      <section class="detail-main">
        <TripMobileTabs
          :active-tab="activeTab"
          @change="selectTab"
        />

        <TripOverviewTab
          v-if="activeTab === 'overview'"
          :trip-title="tripTitle"
          :trip-destination="tripDestination"
          :trip-period="tripPeriod"
          :trip-duration="tripDuration"
          :trip-description="tripDescription"
          :owner-nickname="trip.ownerNickname"
          :cover-image-url="coverImageUrl"
          :participant-count="participantCount"
          :visible-participants="visibleParticipants"
          :remaining-participant-count="remainingParticipantCount"
          :timeline-groups="timelineGroups"
          :map-photos="mapPhotos"
          :is-owner="isOwner"
          @edit="openTripEdit"
          @delete="handleDeleteTrip"
          @leave="handleLeaveTrip"
          @open-participants="openParticipantModal"
          @add-photo="openPhotoUpload"
          @timeline="selectTab('timeline')"
          @cover-error="revokeCoverImageUrl"
        />

        <TripTimelineTab
          v-else-if="activeTab === 'timeline'"
          :timeline-groups="timelineGroups"
        />

        <TripPhotosTab
          v-else-if="activeTab === 'photos'"
          :photos="photos"
          @add-photo="openPhotoUpload"
          @delete-photos="handleDeletePhotos"
          @update-memo="handleUpdatePhotoMemo"
          @update-taken-at="handleUpdatePhotoTakenAt"
          @update-location="handleUpdatePhotoLocation"
          @delete-location="handleDeletePhotoLocation"
        />

        <TripMapTab
          v-else-if="activeTab === 'map'"
          :photos="mapPhotos"
        />

        <TripAiDiaryTab
          v-else-if="activeTab === 'ai-diary'"
          :content="aiDiary?.content ?? null"
          :is-generating="isGeneratingAiDiary"
          :is-owner="isOwner"
          @generate="handleGenerateAiDiary"
        />
      </section>
    </div>

    <TripEditModal
      v-if="isTripEditModalOpen && trip"
      :title="trip.title"
      :destination="trip.destination"
      :start-date="trip.startDate"
      :end-date="trip.endDate"
      :description="trip.description"
      :cover-image-url="coverImageUrl"
      :is-saving="isSavingTrip"
      :error-message="tripEditErrorMessage"
      @close="closeTripEdit"
      @save="updateCurrentTrip"
    />

    <ParticipantManagementModal
      v-if="isParticipantModalOpen && trip"
      v-model:invite-nickname="inviteNickname"
      :participant-count="participantCount"
      :participants="participants"
      :owner-id="trip.ownerId"
      :is-owner="isOwner"
      :is-inviting="isInviting"
      :invitation-message="invitationMessage"
      :invitation-error-message="invitationErrorMessage"
      @close="closeParticipantModal"
      @invite="sendInvitation"
    />

    <input
      v-if="trip"
      ref="photoInputRef"
      class="photo-file-input"
      type="file"
      accept="image/*"
      multiple
      @change="handlePhotoSelect"
    />

    <button
      v-if="trip && showMobilePhotoButton"
      class="mobile-floating-button"
      type="button"
      @click="openPhotoUpload"
    >
      + 사진 추가
    </button>
  </main>
</template>

<style scoped>
.trip-detail-page {
  min-height: 100vh;
  padding: 24px 24px 80px;
  background: var(--tmr-background);
}

.detail-state-card {
  display: flex;
  min-height: 280px;
  max-width: 720px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 48px auto 0;
  padding: 30px;
  border: 1px solid var(--tmr-border);
  border-radius: 16px;
  color: var(--tmr-text-sub);
  background: var(--tmr-surface);
}

.detail-state-card p {
  margin: 0;
  font-size: 13px;
}

.detail-state-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--tmr-surface-soft);
  border-top-color: var(--tmr-primary);
  border-radius: 50%;
  animation: detail-spin 0.8s linear infinite;
}

.detail-error-icon {
  display: flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--tmr-accent);
  background: var(--tmr-accent-soft);
}

.detail-error-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.detail-error-card h1 {
  margin: 2px 0 0;
  font-size: 19px;
  color: var(--tmr-text);
}

.detail-error-card button {
  height: 38px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--tmr-surface);
  background: var(--tmr-primary);
  transition:
    background 0.2s ease,
    transform 0.15s ease;
}

.detail-error-card button:hover {
  background: var(--tmr-primary-dark);
}

.detail-error-card button:active {
  transform: scale(0.98);
}

.detail-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 18px;
  max-width: 1320px;
  margin: 0 auto;
}

.detail-main {
  min-width: 0;
}

.photo-file-input,
.mobile-floating-button {
  display: none;
}

@keyframes detail-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 760px) {
  .trip-detail-page {
    min-height: calc(100vh - 52px);
    padding: 0 0 24px;
  }

  .detail-state-card {
    min-height: 240px;
    margin: 18px 10px 0;
    padding: 22px 16px;
    border-radius: 12px;
  }

  .detail-state-card p {
    font-size: 11px;
  }

  .detail-error-card h1 {
    font-size: 15px;
  }

  .detail-layout {
    display: block;
    max-width: none;
    margin: 0;
  }

  .mobile-floating-button {
    position: fixed;
    right: 14px;
    bottom: 16px;
    z-index: 30;
    display: inline-flex;
    height: 38px;
    align-items: center;
    justify-content: center;
    padding: 0 14px;
    border: 0;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    color: var(--tmr-surface);
    background: var(--tmr-primary);
    box-shadow: 0 8px 20px
      color-mix(in srgb, var(--tmr-primary) 30%, transparent);
  }

  .mobile-floating-button:active {
    background: var(--tmr-primary-dark);
    transform: scale(0.97);
  }
}
</style>