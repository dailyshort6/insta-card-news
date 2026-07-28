# upload.md — 인스타그램 자동 업로드 스펙 (4단계, 최종 단계)

style.md에서 QA를 통과한 카드뉴스(이미지 5장 + 캡션)를 받아
실제로 인스타그램에 캐러셀 게시물로 자동 업로드하는 마지막 단계.

---

## 1. 입력

style.md에서 넘어온 JSON:

```json
{
  "date": "{날짜}",
  "qa_passed": true,
  "qa_retries": 0,
  "image_paths": [
    "{경로}/{날짜}_card_01.png",
    "{경로}/{날짜}_card_02.png",
    "{경로}/{날짜}_card_03.png",
    "{경로}/{날짜}_card_04.png",
    "{경로}/{날짜}_card_05.png"
  ],
  "caption": "{인스타 게시글 본문 캡션}"
}
```

`qa_passed`가 `false`면 이 단계는 실행하지 않고 사람에게 알림만 보낸다.

---

## 2. 이미지 공개 호스팅 업로드

Instagram Graph API는 게시 시점에 메타가 이미지를 직접 가져가기 때문에,
**공개적으로 접근 가능한 URL**이 반드시 필요하다. 로컬 파일 경로로는 게시 불가능.

- 호스팅 후보: GitHub Pages(무료), Cloudinary, AWS S3
- 절차: `image_paths`의 5개 파일을 호스팅에 업로드 → 각각의 공개 URL 5개 확보
- 파일명은 그대로 유지 (`{날짜}_card_01.png` 등)해서 나중에 추적 가능하게

---

## 3. Instagram Graph API 게시 절차 (2단계 구조)

**중요 (실제 시행착오로 확인된 사항)**: 인증 방식에 따라 API 호스트가 다르다.
- 이 프로젝트는 **Instagram 자체 로그인(Business Login)** 방식 사용 (`IGAA...`로 시작하는 토큰, 이용 사례 → Instagram API → "Instagram 로그인이 포함된 API"에서 발급)
- 이 방식의 토큰은 반드시 **`graph.instagram.com`** 호스트로만 호출해야 함
- `graph.facebook.com`으로 호출하면 "Invalid OAuth access token" / 파싱 실패 에러가 남 (페이스북 로그인 방식 전용 호스트라 토큰 형식이 안 맞음)
- 아래 모든 요청은 이 프로젝트의 실제 인증 방식에 맞춰 `graph.instagram.com` 기준으로 작성됨

### 3-1. 카드별 미디어 컨테이너 생성
5개 이미지 각각에 대해 호출:

```
POST https://graph.instagram.com/v21.0/{ig-user-id}/media
  image_url: {공개 URL}
  is_carousel_item: true
  access_token: {장기 액세스 토큰}
```

→ 각 호출마다 `id`(컨테이너 ID)를 반환받아 5개를 순서대로 저장

### 3-2. 캐러셀 컨테이너로 묶기

```
POST https://graph.instagram.com/v21.0/{ig-user-id}/media
  media_type: CAROUSEL
  children: [container_id_1, container_id_2, container_id_3, container_id_4, container_id_5]
  caption: {caption}
  access_token: {장기 액세스 토큰}
```

→ 캐러셀 컨테이너 ID(`creation_id`) 반환

### 3-3. 게시 발행

```
POST https://graph.instagram.com/v21.0/{ig-user-id}/media_publish
  creation_id: {creation_id}
  access_token: {장기 액세스 토큰}
```

→ 성공하면 실제 게시된 미디어 ID 반환

---

## 4. 게시 후 처리

- 게시 성공 시: 텔레그램으로 "오늘 카드뉴스 게시 완료" + 게시물 링크(`instagram.com/p/{shortcode}`) 전송
- 게시 실패 시: 실패 사유(토큰 만료, rate limit, 이미지 URL 접근 불가 등)와 함께 텔레그램으로 즉시 알림 — 이 경우 자동 재시도하지 않고 사람 확인 대기

---

## 5. 에러 처리 원칙

| 에러 상황 | 처리 방법 |
|---|---|
| 액세스 토큰 만료 | 장기 토큰 자동 갱신 로직 필요 (60일 주기) — 갱신 실패 시 사람에게 알림 |
| Rate limit 초과 | 일정 시간 대기 후 1회 재시도, 재실패 시 사람에게 알림 |
| 이미지 URL 접근 불가 | 호스팅 업로드 단계(2번)부터 재시도, 2회 초과 시 중단 |
| 캐러셀 컨테이너 생성 실패 | 개별 컨테이너 ID 유효성 확인 후 1회 재시도 |

---

## 6. 실행 전 준비물 (본인이 확보해야 하는 것)

- **액세스 토큰** — Meta 개발자 콘솔 → 이용 사례 → Instagram API → "Instagram 로그인이 포함된 API" → "2. 액세스 토큰 생성"에서 발급 (`IGAA...`로 시작, graph.instagram.com 전용)
- **Instagram 계정 ID (ig-user-id)** — 토큰 발급 화면에 계정과 함께 표시되는 ID 사용, 또는 `https://graph.instagram.com/me?fields=id,username&access_token={토큰}` 호출로 확인
- **이미지 호스팅 계정** — GitHub Pages 등 무료 옵션이면 충분
- 토큰/계정 ID는 코드에 직접 쓰지 말고 환경변수로 관리 (`IG_ACCESS_TOKEN`, `IG_USER_ID`)

## 7. 남은 실행 전 조치
- 위 3가지 준비물이 실제로 확보/환경변수 등록되었는지 확인
- 장기 토큰 자동 갱신 스크립트를 별도로 만들어 60일마다 자동 실행되게 예약 필요 (그렇지 않으면 두 달마다 수동 재발급)
- 실제 게시 전, 비공개 테스트 계정이나 예비 계정으로 1회 시험 게시 권장
