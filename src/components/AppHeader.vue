<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import {
  getStoredMember,
  logout as clearStoredLogin,
  type Member,
} from '@/api/auth'
import travelStoryLogo from '@/assets/images/travel-story-logo.png'
import { getTripDetail } from '@/api/trips'
import useNotifications from '@/composables/notifications/useNotifications'

import AppNotificationPopup from './layout/AppNotificationPopup.vue'
import MobileBottomNavigation from './layout/MobileBottomNavigation.vue'

const route = useRoute()
const router = useRouter()

const currentMember = ref<Member | null>(getStoredMember())
const tripDetailTitle = ref('여행 상세')

const {
  isNotificationOpen,
  notifications,
  unreadCount,
  loadUnreadCount,
  toggleNotificationPopup,
  closeNotificationPopup,
  markAllAsRead,
  markAsRead,
  openNotification,
} = useNotifications(currentMember)

const memberNickname = computed(() => currentMember.value?.nickname ?? '마이페이지')
const isAuthenticated = computed(() => currentMember.value !== null)
const isHomePage = computed(() => route.name === 'home')
const isTripsPage = computed(() => route.name === 'trips')
const isTripDetailPage = computed(() => route.name === 'trip-detail')

const mobileTitle = computed(() => {
  switch (route.name) {
    case 'trips':
      return '여행 기록'
    case 'invitations':
      return '초대 관리'
    case 'mypage':
      return '마이페이지'
    case 'trip-create':
      return '여행 만들기'
    case 'trip-detail':
      return tripDetailTitle.value
    default:
      return 'Travel Story'
  }
})

const loadTripDetailTitle = async () => {
  if (route.name !== 'trip-detail') {
    tripDetailTitle.value = '여행 상세'
    return
  }

  const routeId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id
  const tripId = Number(routeId)

  if (!Number.isInteger(tripId) || tripId <= 0) {
    tripDetailTitle.value = '여행 상세'
    return
  }

  try {
    const trip = await getTripDetail(tripId)
    tripDetailTitle.value = trip.title
  } catch {
    tripDetailTitle.value = '여행 상세'
  }
}

const closeNotificationOnOutsideClick = (event: MouseEvent) => {
  const target = event.target
  if (!(target instanceof Element)) return

  if (!target.closest('.notification-wrapper, .mobile-notification-wrapper')) {
    closeNotificationPopup()
  }
}

const goBack = () => {
  if (window.history.state?.back) {
    router.back()
    return
  }

  void router.push('/')
}

const goToCreateTrip = () => {
  void router.push('/trips/create')
}

const handleLogout = () => {
  clearStoredLogin()
  currentMember.value = null
  closeNotificationPopup()
  void router.replace('/login')
}

watch(
  () => route.fullPath,
  () => {
    closeNotificationPopup()
    void loadUnreadCount()
  },
)

watch(
  [() => route.name, () => route.params.id],
  () => {
    void loadTripDetailTitle()
  },
  { immediate: true },
)

onMounted(() => {
  void loadUnreadCount()
  document.addEventListener('click', closeNotificationOnOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeNotificationOnOutsideClick)
})
</script>

<template>
  <header class="desktop-header">
    <RouterLink class="brand" to="/">
      <img
        :src="travelStoryLogo"
        alt="Travel Story"
        class="brand-logo"
      />
    </RouterLink>

    <nav v-if="isAuthenticated" class="desktop-navigation">
      <RouterLink to="/">홈</RouterLink>
      <RouterLink to="/trips">여행 기록</RouterLink>
      <RouterLink to="/invitations">초대 관리</RouterLink>
    </nav>

    <div v-else></div>

    <div v-if="isAuthenticated" class="desktop-actions">
      <div class="notification-wrapper">
        <button
          class="notification-button"
          type="button"
          aria-label="알림 열기"
          :aria-expanded="isNotificationOpen"
          @click="toggleNotificationPopup"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </svg>

          <span v-if="unreadCount > 0" class="notification-count">
            {{ unreadCount > 9 ? '9+' : unreadCount }}
          </span>
        </button>

        <AppNotificationPopup
          v-if="isNotificationOpen"
          :notifications="notifications"
          :unread-count="unreadCount"
          @mark-all-read="markAllAsRead"
          @mark-read="markAsRead"
          @open="openNotification"
        />
      </div>

      <div class="account-actions">
        <RouterLink class="mypage-button" to="/mypage" :title="memberNickname">
          {{ memberNickname }}
        </RouterLink>

        <button class="logout-button" type="button" @click="handleLogout">
          로그아웃
        </button>
      </div>
    </div>

    <div
      v-else
      class="desktop-actions public-actions"
    >
      <RouterLink
        class="login-button"
        to="/login"
      >
        로그인
      </RouterLink>

      <RouterLink
        class="signup-button"
        to="/signup"
      >
        회원가입
      </RouterLink>
    </div>
  </header>

  <header
    class="mobile-header"
    :class="{ 'trip-detail-header': isTripDetailPage }"
  >
    <span
      v-if="isHomePage"
      class="mobile-header-side"
    ></span>

    <button
      v-else
      class="mobile-header-button"
      type="button"
      aria-label="이전 화면으로 이동"
      @click="goBack"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>

    <RouterLink
      v-if="isHomePage"
      class="mobile-brand"
      to="/"
      aria-label="Travel Story 홈"
    >
      <img
        :src="travelStoryLogo"
        alt="Travel Story"
        class="mobile-brand-logo"
      />
    </RouterLink>

    <strong v-else class="mobile-header-title">
      {{ mobileTitle }}
    </strong>

    <div v-if="isHomePage" class="mobile-notification-wrapper">
      <button
        class="mobile-notification"
        type="button"
        aria-label="알림 열기"
        :aria-expanded="isNotificationOpen"
        @click="toggleNotificationPopup"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>

        <span v-if="unreadCount > 0" class="notification-count">
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </button>

      <AppNotificationPopup
        v-if="isNotificationOpen"
        mobile
        :notifications="notifications"
        :unread-count="unreadCount"
        @mark-all-read="markAllAsRead"
        @mark-read="markAsRead"
        @open="openNotification"
      />
    </div>

    <button
      v-else-if="isTripsPage"
      class="mobile-header-button"
      type="button"
      aria-label="새 여행 만들기"
      @click="goToCreateTrip"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>

    <span v-else class="mobile-header-side"></span>
  </header>

  <MobileBottomNavigation v-if="isAuthenticated && !isTripDetailPage" />
</template>

<style scoped>
.desktop-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 76px;
  padding: 0 48px;
  border-bottom: 1px solid var(--tmr-border);
  background: var(--tmr-surface);
}

.brand {
  display: flex;
  width: fit-content;
  align-items: center;
}

.brand-logo {
  width: 160px;
  height: auto;
  object-fit: contain;
}

.desktop-navigation {
  display: flex;
  height: 100%;
  align-items: stretch;
  gap: 92px;
}

.desktop-navigation a {
  position: relative;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--tmr-text-sub);
}

.desktop-navigation a:hover,
.desktop-navigation a.router-link-exact-active {
  color: var(--tmr-primary);
}

.desktop-navigation a.router-link-exact-active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: var(--tmr-primary);
  content: '';
}

.desktop-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 28px;
}

.public-actions {
  gap: 8px;
}

.login-button,
.signup-button {
  display: flex;
  height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  border-radius: 24px;
  font-size: 12px;
  font-weight: 600;
}

.login-button {
  border: 1px solid var(--tmr-border);
  color: var(--tmr-text-sub);
  background: var(--tmr-surface);
}

.login-button:hover {
  border-color: var(--tmr-primary);
  color: var(--tmr-primary);
}

.signup-button {
  color: var(--tmr-surface);
  background: var(--tmr-primary-dark);
}

.signup-button:hover {
  background: var(--tmr-primary);
}

.account-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mypage-button {
  display: flex;
  min-width: 84px;
  max-width: 150px;
  height: 42px;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
  overflow: hidden;
  border-radius: 24px;
  font-size: 13px;
  color: var(--tmr-surface);
  text-overflow: ellipsis;
  white-space: nowrap;
  background: var(--tmr-primary-dark);
}

.mypage-button:hover {
  background: var(--tmr-primary);
}

.logout-button {
  height: 42px;
  padding: 0 16px;
  border: 1px solid var(--tmr-border);
  border-radius: 24px;
  font-size: 12px;
  font-weight: 600;
  color: var(--tmr-text-sub);
  background: var(--tmr-surface);
}

.logout-button:hover {
  border-color: var(--tmr-primary);
  color: var(--tmr-primary-dark);
  background: var(--tmr-surface-soft);
}

.notification-wrapper,
.mobile-notification-wrapper {
  position: relative;
}

.notification-button,
.mobile-notification {
  position: relative;
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  padding: 0;
  border: 0;
  color: var(--tmr-text);
  background: transparent;
}

.notification-button svg,
.mobile-notification svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.notification-count {
  position: absolute;
  top: -6px;
  right: -7px;
  display: flex;
  min-width: 17px;
  height: 17px;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--tmr-surface);
  border-radius: 10px;
  font-size: 8px;
  font-weight: 700;
  color: var(--tmr-surface);
  background: var(--tmr-accent);
}

.mobile-header {
  display: none;
}

@media (max-width: 760px) {
  .desktop-header {
    display: none;
  }

  .mobile-header {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 36px;
    height: 58px;
    align-items: center;
    padding: 0 17px;
    border-bottom: 1px solid var(--tmr-border);
    background: var(--tmr-surface);
  }

  .mobile-header.trip-detail-header {
    height: 52px;
    padding: 0 12px;
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-brand-logo {
    width: 110px;
    height: auto;
    object-fit: contain;
  }

  .mobile-header-title {
    overflow: hidden;
    font-size: 15px;
    font-weight: 700;
    color: var(--tmr-text);
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .trip-detail-header .mobile-header-title {
    font-size: 14px;
  }

  .mobile-header-button {
    display: flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    color: var(--tmr-text);
    background: transparent;
  }

  .mobile-header-button svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 1.8;
  }

  .mobile-header > .mobile-header-button:first-child {
    justify-self: start;
  }

  .mobile-header > .mobile-header-button:last-child {
    justify-self: end;
  }

  .mobile-header-side {
    display: block;
    width: 24px;
    height: 24px;
    justify-self: end;
  }

  .mobile-notification-wrapper {
    justify-self: end;
  }

  .mobile-notification {
    width: 24px;
    height: 24px;
  }

  .mobile-notification svg {
    width: 20px;
    height: 20px;
  }

  .mobile-notification .notification-count {
    top: -7px;
    right: -8px;
    min-width: 16px;
    height: 16px;
    font-size: 7px;
  }
}
</style>