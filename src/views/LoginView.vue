<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { login } from '@/api/auth'
import { ApiError } from '@/api/http'
import AuthShell from '@/components/AuthShell.vue'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const rememberLogin = ref(false)
const showPassword = ref(false)
const formError = ref('')
const isSubmitting = ref(false)

const isRegistered = computed(() => route.query.registered === 'true')

const isPasswordReset = computed(
  () => route.query.passwordReset === 'true',
)

const isSessionExpired = computed(
  () => route.query.expired === '1',
)

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const handleLogin = async () => {
  formError.value = ''

  const trimmedEmail = email.value.trim()

  if (!trimmedEmail) {
    formError.value = '이메일을 입력해 주세요.'
    return
  }

  if (!isValidEmail(trimmedEmail)) {
    formError.value = '올바른 이메일 형식을 입력해 주세요.'
    return
  }

  if (!password.value) {
    formError.value = '비밀번호를 입력해 주세요.'
    return
  }

  try {
    isSubmitting.value = true

    await login(
      {
        email: trimmedEmail,
        password: password.value,
      },
      rememberLogin.value,
    )

    await router.replace('/')
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      formError.value = error.message
      return
    }

    formError.value =
      '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AuthShell
    title="로그인"
    description="로그인하고 친구들과 함께 여행 기록을 시작해 보세요."
  >
    <p v-if="isSessionExpired" class="auth-error">
      로그인 시간이 만료되었습니다. 다시 로그인해 주세요.
    </p>

    <p v-if="isRegistered" class="auth-success">
      회원가입이 완료되었습니다. 로그인해 주세요.
    </p>

    <p v-if="isPasswordReset" class="auth-success">
      비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요.
    </p>

    <form class="auth-form" @submit.prevent="handleLogin">
      <div class="auth-field">
        <label for="login-email">이메일</label>

        <input
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          placeholder="example@email.com"
        />
      </div>

      <div class="auth-field">
        <label for="login-password">비밀번호</label>

        <div class="auth-input-wrap">
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="비밀번호를 입력해 주세요."
          />

          <button
            class="auth-password-toggle"
            type="button"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? '숨기기' : '보기' }}
          </button>
        </div>
      </div>

      <div class="auth-options">
        <label class="auth-checkbox">
          <input v-model="rememberLogin" type="checkbox" />
          <span>로그인 상태 유지</span>
        </label>

        <RouterLink
          class="auth-text-button"
          to="/forgot-password"
        >
          비밀번호를 잊으셨나요?
        </RouterLink>
      </div>

      <p v-if="formError" class="auth-error">
        {{ formError }}
      </p>

      <button
        class="auth-submit"
        type="submit"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? '로그인 중...' : '로그인' }}
      </button>
    </form>

    <p class="auth-switch">
      아직 계정이 없으신가요?
      <RouterLink to="/signup">
        회원가입
      </RouterLink>
    </p>

    <p class="auth-legal">
      Travel Story는 사진과 위치를 기반으로 여행 기록을 저장하고
      함께 공유할 수 있는 서비스입니다.
      <RouterLink to="/privacy">
        개인정보처리방침
      </RouterLink>
    </p>
  </AuthShell>
</template>

<style scoped>
.auth-legal {
  margin: 18px 0 0;
  font-size: 10px;
  line-height: 1.6;
  color: var(--tmr-text-sub);
  text-align: center;
}

.auth-legal a {
  margin-left: 4px;
  color: var(--tmr-primary);
  font-weight: 600;
  text-decoration: none;
}

.auth-legal a:hover {
  text-decoration: underline;
}
</style>