import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

import { getAccessToken } from '@/api/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: {
        authPage: true,
      },
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/SignUpView.vue'),
      meta: {
        authPage: true,
      },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue'),
      meta: {
        authPage: true,
      },
    },
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/trips',
      name: 'trips',
      component: () => import('@/views/TripsView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/trips/create',
      name: 'trip-create',
      component: () => import('@/views/TripCreateView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/trips/:id',
      name: 'trip-detail',
      component: () => import('@/views/TripDetailView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/invitations',
      name: 'invitations',
      component: () => import('@/views/TripInvitationsView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/mypage',
      name: 'mypage',
      component: () => import('@/views/MyPageView.vue'),
      meta: {
        requiresAuth: true,
      },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('@/views/PrivacyPolicyView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  const accessToken = getAccessToken()

  if (to.meta.requiresAuth && !accessToken) {
    return {
      name: 'login',
    }
  }

  if (to.meta.authPage && accessToken) {
    return {
      name: 'home',
    }
  }
})

export default router