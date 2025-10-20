# 카카오 OAuth2 설정 가이드

## 1. 카카오 개발자 콘솔 설정

### 1.1 앱 키 설정
- **REST API 키**: `ff6cc7d8b12721388ef90e85fc71d639` (이미 .env에 설정됨)
- **JavaScript 키**: 프론트엔드에서 필요시 사용
- **Admin 키**: 관리자 API용

### 1.2 Redirect URI 설정

카카오 개발자 콘솔(https://developers.kakao.com/)에서:

1. **내 애플리케이션 > 앱 설정 > 플랫폼**
   - Web 플랫폼 등록
   - 사이트 도메인:
     - `http://localhost:3000` (백엔드)
     - `http://localhost:3002` (프론트엔드)

2. **카카오 로그인 > Redirect URI**
   - 다음 URI를 등록하세요:
   ```
   http://localhost:3000/auth/kakao/callback
   ```

### 1.3 동의 항목 설정

**카카오 로그인 > 동의항목**에서 다음 항목 설정:

- **닉네임** - 필수 동의
- **프로필 사진** - 선택 동의
- **이메일** - 선택 동의

### 1.4 추가 설정

**카카오 로그인 > 보안**:
- Client Secret 사용: 선택사항 (보안 강화를 원하면 활성화)
  - 활성화 시 발급된 Client Secret을 `.env`의 `KAKAO_CLIENT_SECRET`에 입력

## 2. 백엔드 환경 변수

`.env` 파일에 다음 설정이 추가되어 있습니다:

```env
# Kakao OAuth2 Configuration
KAKAO_CLIENT_ID=ff6cc7d8b12721388ef90e85fc71d639
KAKAO_CLIENT_SECRET=YOUR_KAKAO_CLIENT_SECRET_HERE_IF_NEEDED
KAKAO_CALLBACK_URL=http://localhost:3000/auth/kakao/callback
```

## 3. OAuth2 인증 플로우

### 3.1 로그인 요청
```
GET http://localhost:3000/auth/kakao
→ 카카오 로그인 페이지로 리다이렉트
```

### 3.2 카카오 인증 후 콜백
```
GET http://localhost:3000/auth/kakao/callback?code=AUTHORIZATION_CODE
→ 인가 코드로 액세스 토큰 교환
→ 사용자 정보 조회
→ JWT 토큰 발급
→ 프론트엔드로 리다이렉트 (JWT 포함)
```

### 3.3 프론트엔드 리다이렉트
성공 시:
```
http://localhost:3002/auth/callback?token=JWT_TOKEN
```

실패 시:
```
http://localhost:3002/auth/login?error=authentication_failed
```

## 4. API 엔드포인트

- `GET /auth/kakao` - 카카오 로그인 시작
- `GET /auth/kakao/callback` - 카카오 콜백 처리

## 5. 테스트 방법

1. 프론트엔드 로그인 페이지에서 "카카오로 시작하기" 버튼 클릭
2. 카카오 로그인 진행
3. 인증 성공 시 자동으로 우리 서비스로 로그인
4. JWT 토큰이 localStorage에 저장됨
5. 이후 모든 API 요청은 JWT로 인증

## 주의사항

- 프로덕션 환경에서는 HTTPS 사용 필수
- Redirect URI는 정확히 일치해야 함 (trailing slash 주의)
- Client Secret 사용 시 절대 프론트엔드에 노출하지 말 것