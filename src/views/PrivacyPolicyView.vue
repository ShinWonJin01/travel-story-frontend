<script setup lang="ts">
const effectiveDate = '2026년 9월 8일'
</script>

<template>
  <main class="privacy-page">
    <section class="privacy-card">
      <h1>개인정보처리방침</h1>
      <p class="effective-date">
        시행일: {{ effectiveDate }}
      </p>

      <p>
        Travel Story는 여행 기록 서비스를 제공하기 위해
        필요한 범위에서 개인정보를 처리합니다.
      </p>

      <section>
        <h2>1. 수집 및 이용하는 정보</h2>
        <p>서비스 이용 과정에서 다음 정보가 처리될 수 있습니다.</p>
        <ul>
          <li>회원가입 및 로그인에 필요한 계정 정보</li>
          <li>여행 제목, 일정, 장소, 메모 등 여행 기록</li>
          <li>사용자가 업로드한 사진 및 사진의 촬영 정보</li>
          <li>
            사용자가 허용한 경우 사진 기록에 사용되는 위치 정보
          </li>
          <li>비밀번호 재설정을 위해 입력한 이메일 주소</li>
        </ul>
      </section>

      <section>
        <h2>2. 정보의 이용 목적</h2>
        <ul>
          <li>회원 인증 및 계정 관리</li>
          <li>여행 기록의 저장 및 조회</li>
          <li>사진의 시간 및 위치 기반 여행 기록 제공</li>
          <li>비밀번호 재설정 인증번호 발송</li>
          <li>AI 여행기 생성 기능 제공</li>
        </ul>
      </section>

      <section>
        <h2>3. 외부 서비스 이용</h2>
        <p>
          Travel Story는 서비스 제공을 위해 다음 외부 서비스를
          이용할 수 있습니다.
        </p>
        <ul>
          <li>Render: 웹 애플리케이션 호스팅</li>
          <li>TiDB Cloud: 서비스 데이터 저장</li>
          <li>Cloudinary: 이미지 저장 및 제공</li>
          <li>MapTiler: 지도 표시</li>
          <li>Google Gmail API: 비밀번호 재설정 이메일 발송</li>
          <li>Google Gemini API: AI 여행기 생성</li>
        </ul>
      </section>

      <section>
        <h2>4. Gmail API 사용</h2>
        <p>
          Travel Story는 비밀번호 재설정 인증번호를 발송하기 위해
          서비스 전용 Google 계정의 Gmail API를 사용합니다.
        </p>
        <p>
          Travel Story 사용자의 Gmail 계정에 로그인하거나
          사용자의 이메일 내용을 읽는 기능은 사용하지 않습니다.
        </p>
      </section>

      <section>
        <h2>5. 위치 정보</h2>
        <p>
          위치 정보는 사용자가 브라우저에서 위치 권한을 허용하고
          현재 위치 사용에 동의한 경우에만 사진 기록에 사용됩니다.
        </p>
      </section>

      <section>
        <h2>6. 개인정보의 보관 및 삭제</h2>
        <p>
          서비스에 저장된 정보는 서비스 제공을 위해 필요한 기간 동안
          보관되며, 사용자가 관련 기록 또는 계정을 삭제하는 경우
          해당 기능의 처리 절차에 따라 삭제됩니다.
        </p>
      </section>

      <section>
        <h2>7. 문의</h2>
        <p>
          개인정보처리방침 및 서비스 이용과 관련한 문의는 아래
          이메일로 연락할 수 있습니다.
        </p>
        <p>
          <a href="mailto:travelstory.service@gmail.com">
            travelstory.service@gmail.com
          </a>
        </p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.privacy-page {
  min-height: 100vh;
  padding: 48px 20px;
  background: var(--tmr-background);
}

.privacy-card {
  max-width: 820px;
  margin: 0 auto;
  padding: 36px;
  border: 1px solid var(--tmr-border);
  border-radius: 16px;
  background: var(--tmr-surface);
}

.privacy-card h1 {
  margin: 0;
  font-size: 28px;
  color: var(--tmr-text);
}

.effective-date {
  margin: 8px 0 28px;
  font-size: 12px;
  color: var(--tmr-text-sub);
}

.privacy-card section {
  margin-top: 30px;
}

.privacy-card h2 {
  margin: 0 0 12px;
  font-size: 17px;
  color: var(--tmr-text);
}

.privacy-card p,
.privacy-card li {
  font-size: 13px;
  line-height: 1.8;
  color: var(--tmr-text-sub);
}

.privacy-card ul {
  margin: 10px 0 0;
  padding-left: 20px;
}

.privacy-card a {
  color: var(--tmr-primary);
  text-decoration: none;
}

@media (max-width: 760px) {
  .privacy-page {
    padding: 24px 12px;
  }

  .privacy-card {
    padding: 24px 18px;
    border-radius: 12px;
  }

  .privacy-card h1 {
    font-size: 22px;
  }

  .privacy-card h2 {
    font-size: 15px;
  }

  .privacy-card p,
  .privacy-card li {
    font-size: 12px;
  }
}
</style>