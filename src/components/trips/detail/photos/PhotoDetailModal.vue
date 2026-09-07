<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { Language, MaptilerLayer } from '@maptiler/leaflet-maptilersdk'
import L from 'leaflet'

import type { LocationSearchResult } from '@/api/geocoding'
import LocationSearch from '@/components/trips/LocationSearch.vue'

import 'leaflet/dist/leaflet.css'

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY
const MAPTILER_MAP_ID = '01a06816-6944-7f4c-9c04-68146a27ca8e'
const TMR_PRIMARY = '#4f7cff'

interface PhotoItem {
  id: number
  title: string
  location: string
  imageUrl: string
  memo: string | null
  takenAt: string | null
  latitude: number | null
  longitude: number | null
  canDelete: boolean
  canEditMemo: boolean
  canEditLocation: boolean
}

type EditType = 'takenAt' | 'location' | 'memo' | null

const props = defineProps<{
  photo: PhotoItem
}>()

const emit = defineEmits<{
  close: []
  updateMemo: [photoId: number, memo: string]
  updateTakenAt: [photoId: number, takenAt: string | null]
  updateLocation: [
    photoId: number,
    latitude: number,
    longitude: number,
    locationName: string | null,
  ]
  deleteLocation: [photoId: number]
}>()

const editType = ref<EditType>(null)
const takenAtDraft = ref('')
const memoDraft = ref('')
const selectedLatitude = ref<number | null>(null)
const selectedLongitude = ref<number | null>(null)
const selectedLocationName = ref<string | null>(null)

let locationMap: L.Map | null = null
let locationMarker: L.CircleMarker | null = null

const destroyLocationMap = () => {
  locationMap?.remove()
  locationMap = null
  locationMarker = null
}

const resetEdit = () => {
  destroyLocationMap()

  editType.value = null
  takenAtDraft.value = ''
  memoDraft.value = ''
  selectedLatitude.value = null
  selectedLongitude.value = null
  selectedLocationName.value = null
}

const closeModal = () => {
  resetEdit()
  emit('close')
}

const startTakenAtEdit = () => {
  editType.value = 'takenAt'
  takenAtDraft.value = props.photo.takenAt?.slice(0, 16) ?? ''
}

const saveTakenAt = () => {
  const takenAt = takenAtDraft.value
    ? `${takenAtDraft.value}:00`
    : null

  emit('updateTakenAt', props.photo.id, takenAt)
  resetEdit()
}

const startMemoEdit = () => {
  editType.value = 'memo'
  memoDraft.value = props.photo.memo ?? ''
}

const saveMemo = () => {
  emit('updateMemo', props.photo.id, memoDraft.value)
  resetEdit()
}

const updateLocationMarker = (
  latitude: number,
  longitude: number,
) => {
  if (!locationMap) return

  const position: L.LatLngTuple = [latitude, longitude]

  if (locationMarker) {
    locationMarker.setLatLng(position)
    return
  }

  locationMarker = L.circleMarker(position, {
    radius: 8,
    weight: 2,
    color: TMR_PRIMARY,
    fillColor: TMR_PRIMARY,
    fillOpacity: 0.9,
  }).addTo(locationMap)
}

const handleLocationSearchSelect = (
  location: LocationSearchResult,
) => {
  selectedLatitude.value = location.latitude
  selectedLongitude.value = location.longitude
  selectedLocationName.value = location.name

  if (!locationMap) return

  const position: L.LatLngTuple = [
    location.latitude,
    location.longitude,
  ]

  locationMap.setView(position, 16)
  updateLocationMarker(location.latitude, location.longitude)
}

const startLocationEdit = async () => {
  editType.value = 'location'
  selectedLatitude.value = props.photo.latitude
  selectedLongitude.value = props.photo.longitude
  selectedLocationName.value = null

  await nextTick()

  const mapElement = document.getElementById(
    'photo-detail-location-map',
  )

  if (!mapElement) return

  destroyLocationMap()

  const latitude = props.photo.latitude
  const longitude = props.photo.longitude
  const hasLocation =
    latitude !== null &&
    longitude !== null

  const center: L.LatLngTuple = hasLocation
    ? [latitude, longitude]
    : [36.5, 127.8]

  locationMap = L.map(mapElement).setView(
    center,
    hasLocation ? 15 : 7,
  )

  locationMap.attributionControl.setPrefix(false)

  const mapTilerLayer = new MaptilerLayer({
    apiKey: MAPTILER_API_KEY,
    style: MAPTILER_MAP_ID,
    language: Language.STYLE_LOCK,
  })

  mapTilerLayer.addTo(locationMap)

  if (hasLocation) {
    updateLocationMarker(latitude, longitude)
  }

  locationMap.on('click', (event) => {
    selectedLatitude.value = event.latlng.lat
    selectedLongitude.value = event.latlng.lng
    selectedLocationName.value = null

    updateLocationMarker(
      event.latlng.lat,
      event.latlng.lng,
    )
  })

  requestAnimationFrame(() => {
    locationMap?.invalidateSize()
  })
}

const saveLocation = () => {
  if (
    selectedLatitude.value === null ||
    selectedLongitude.value === null
  ) {
    window.alert(
      '장소를 검색하거나 지도에서 위치를 선택해 주세요.',
    )
    return
  }

  emit(
    'updateLocation',
    props.photo.id,
    selectedLatitude.value,
    selectedLongitude.value,
    selectedLocationName.value,
  )

  resetEdit()
}

const deleteLocation = () => {
  if (
    props.photo.latitude === null ||
    props.photo.longitude === null
  ) {
    return
  }

  const confirmed = window.confirm(
    '이 사진의 위치 정보를 삭제하시겠습니까?',
  )

  if (!confirmed) return

  emit('deleteLocation', props.photo.id)
  resetEdit()
}

onBeforeUnmount(destroyLocationMap)
</script>

<template>
  <div class="modal-backdrop" @click.self="closeModal">
    <section class="photo-modal">
      <button
        class="modal-close-button"
        type="button"
        aria-label="닫기"
        @click="closeModal"
      >
        ×
      </button>

      <img
        class="photo-modal-image"
        :src="photo.imageUrl"
        :alt="photo.title"
      />

      <div class="photo-modal-content">
        <div class="photo-info">
          <strong>{{ photo.title }}</strong>
          <span>{{ photo.location }}</span>
        </div>

        <div v-if="editType === 'takenAt'" class="photo-editor">
          <div class="datetime-input-wrapper">
            <input
              v-model="takenAtDraft"
              type="datetime-local"
              aria-label="촬영일 선택"
            />

            <span
              v-if="!takenAtDraft"
              class="datetime-placeholder"
            >
              촬영일을 선택해 주세요
            </span>
          </div>

          <div class="editor-actions">
            <button type="button" @click="resetEdit">
              취소
            </button>
            <button
              class="save-button"
              type="button"
              @click="saveTakenAt"
            >
              저장
            </button>
          </div>
        </div>

        <div v-else-if="editType === 'location'" class="photo-editor">
          <LocationSearch @select="handleLocationSearchSelect" />

          <div
            id="photo-detail-location-map"
            class="photo-location-map"
          ></div>

          <div class="editor-actions">
            <button
              v-if="
                photo.latitude !== null &&
                photo.longitude !== null
              "
              class="delete-location-button"
              type="button"
              @click="deleteLocation"
            >
              위치 삭제
            </button>

            <button type="button" @click="resetEdit">
              취소
            </button>

            <button
              class="save-button"
              type="button"
              @click="saveLocation"
            >
              저장
            </button>
          </div>
        </div>

        <div v-else-if="editType === 'memo'" class="photo-editor">
          <textarea
            v-model="memoDraft"
            maxlength="1000"
            placeholder="이 순간에 대한 메모를 남겨보세요."
          ></textarea>

          <div class="editor-actions">
            <button type="button" @click="resetEdit">
              취소
            </button>
            <button
              class="save-button"
              type="button"
              @click="saveMemo"
            >
              저장
            </button>
          </div>
        </div>

        <template v-else>
          <div class="photo-memo">
            <span>메모</span>
            <p v-if="photo.memo">{{ photo.memo }}</p>
            <p v-else class="empty-memo">메모가 없습니다.</p>
          </div>

          <div class="photo-actions">
            <button
              v-if="photo.canEditMemo"
              type="button"
              @click="startTakenAtEdit"
            >
              시간 수정
            </button>

            <button
              v-if="photo.canEditLocation"
              type="button"
              @click="startLocationEdit"
            >
              위치 수정
            </button>

            <button
              v-if="photo.canEditMemo"
              type="button"
              @click="startMemoEdit"
            >
              {{ photo.memo ? '메모 수정' : '메모 추가' }}
            </button>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 20, 30, 0.65);
}

.photo-modal {
  position: relative;
  width: min(760px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  border: 1px solid var(--tmr-border);
  border-radius: 16px;
  background: var(--tmr-surface);
  box-shadow: 0 18px 50px rgba(20, 30, 45, 0.2);
}

.modal-close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  font-size: 22px;
  color: #ffffff;
  background: rgba(20, 26, 36, 0.7);
  transition: background 0.2s ease;
}

.modal-close-button:hover {
  background: rgba(20, 26, 36, 0.9);
}

.photo-modal-image {
  display: block;
  width: 100%;
  max-height: 520px;
  object-fit: contain;
  background: #111722;
}

.photo-modal-content {
  padding: 20px;
}

.photo-info strong {
  display: block;
  font-size: 18px;
  color: var(--tmr-text);
}

.photo-info span {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--tmr-text-sub);
}

.photo-memo {
  margin-top: 18px;
}

.photo-memo > span {
  font-size: 11px;
  font-weight: 700;
  color: var(--tmr-text-sub);
}

.photo-memo p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--tmr-text);
}

.photo-memo .empty-memo {
  color: var(--tmr-text-sub);
}

.photo-actions {
  display: flex;
  gap: 8px;
  margin-top: 18px;
}

.photo-actions button,
.editor-actions button {
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--tmr-border);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--tmr-text-sub);
  background: var(--tmr-surface);
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background 0.2s ease;
}

.photo-actions button:hover,
.editor-actions button:hover {
  border-color: var(--tmr-primary);
  color: var(--tmr-primary);
  background: var(--tmr-surface-soft);
}

.datetime-input-wrapper {
  position: relative;
}

.datetime-placeholder {
  position: absolute;
  top: 50%;
  left: 11px;
  color: var(--tmr-text-sub);
  font-size: 13px;
  transform: translateY(-50%);
  pointer-events: none;
}

.photo-editor {
  margin-top: 18px;
}

.photo-editor input,
.photo-editor textarea {
  box-sizing: border-box;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--tmr-border);
  border-radius: 8px;
  outline: none;
  font: inherit;
  color: var(--tmr-text);
  background: var(--tmr-surface);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.photo-editor input:focus,
.photo-editor textarea:focus {
  border-color: var(--tmr-primary);
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--tmr-primary) 12%, transparent);
}

.photo-editor textarea {
  min-height: 100px;
  line-height: 1.6;
  resize: vertical;
}

.photo-location-map {
  height: 300px;
  margin-top: 10px;
  overflow: hidden;
  border: 1px solid var(--tmr-border);
  border-radius: 10px;
  background: var(--tmr-surface-soft);
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.editor-actions .save-button {
  border-color: var(--tmr-primary);
  color: var(--tmr-surface);
  background: var(--tmr-primary);
}

.editor-actions .save-button:hover {
  border-color: var(--tmr-primary-dark);
  color: var(--tmr-surface);
  background: var(--tmr-primary-dark);
}

.editor-actions .delete-location-button {
  margin-right: auto;
  border-color: #dc2626;
  color: #dc2626;
}

.editor-actions .delete-location-button:hover {
  border-color: #b91c1c;
  color: #b91c1c;
  background: #fef2f2;
}

@media (max-width: 760px) {
  .modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .photo-modal {
    width: 100%;
    max-height: 92vh;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 16px 16px 0 0;
  }

  .photo-modal-image {
    max-height: 52vh;
  }

  .photo-modal-content {
    padding: 16px;
  }

  .photo-location-map {
    height: 260px;
  }

  .photo-actions {
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 14px;
  }

  .photo-actions button,
  .editor-actions button {
    height: 32px;
    font-size: 10px;
  }
}
</style>