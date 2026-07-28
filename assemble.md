# assemble.md — 전체 파이프라인 총괄 (오케스트레이터)

search.md → message.md → style.md → upload.md 4개 단계를 순서대로 실행하고,
단계 간 데이터를 넘겨주는 총괄 문서. 예약 작업(Claude Code, 매일 08:30)은
이 문서 하나만 참조하면 전체 파이프라인이 실행되도록 구성.

---

## 1. 전체 흐름

```
08:30 자동 트리거
  │
  ▼
[1] search.md 실행
  재테크/투자/경제 자료조사 → 후보 5개 압축
  │  출력: 후보 5개 (JSON)
  ▼
[2] message.md 실행
  텔레그램 전송 → 사람이 숫자로 답장 → 주제 확정
  │  출력: { date, selected_topic, hook, format }
  ▼
[3] style.md 실행
  카피 작성 → 이미지 생성 → 자체 QA (최대 3회 재시도)
  │  출력: { date, qa_passed, image_paths[5], caption }
  ▼
  qa_passed == true?
     ├─ No  → 사람에게 알림, 파이프라인 중단
     └─ Yes ▼
[4] upload.md 실행
  이미지 호스팅 업로드 → Graph API 2단계 게시 → 결과 알림
  │
  ▼
종료 (성공/실패 텔레그램 알림으로 마무리)
```

---

## 2. 단계 간 데이터 계약 (Data Contract)

각 단계는 이전 단계의 출력 JSON을 그대로 입력으로 받는다. 중간에 사람이 끼는 지점은 2단계(주제 승인) 하나뿐이며, 나머지는 전부 자동.

| 단계 | 입력 | 출력 |
|---|---|---|
| search.md | (없음, 트리거로 시작) | 후보 5개 (주제/근거/후킹/형식) |
| message.md | 후보 5개 | `{date, selected_topic, hook, format}` |
| style.md | 위 JSON | `{date, qa_passed, qa_retries, image_paths[], caption}` |
| upload.md | 위 JSON | 게시 성공/실패 결과 |

---

## 3. 중단 조건 (Fail-safe)

파이프라인은 아래 경우 즉시 중단하고 사람에게 텔레그램으로 알린다. 다음 단계로 절대 넘어가지 않는다:

- search.md: 조사 결과 유의미한 후보가 없을 때 (search.md 지침대로 "간단히 보고")
- message.md: 사람이 2회 피드백 후에도 주제를 확정하지 않을 때
- style.md: 자체 QA 3회 재시도 후에도 통과하지 못할 때
- upload.md: 토큰 만료/API 에러가 재시도 후에도 해결되지 않을 때

---

## 4. 예약 작업(Claude Code Remote)에 넣을 지시문

```
매일 08:30, 아래 순서대로 카드뉴스 파이프라인을 실행해줘.
각 단계의 세부 방법은 해당 md 파일을 그대로 따른다.

1. /mnt/user-data/outputs/search.md 방법대로 자료조사 → 주제 후보 5개 생성
2. /mnt/user-data/outputs/message.md 방법대로 텔레그램 전송 → 사람 답장으로 주제 확정
3. /mnt/user-data/outputs/style.md 방법대로 카피 작성 → finance_card_template.html에
   내용 삽입 → 이미지 렌더링 → 자체 QA
4. QA를 통과하면 /mnt/user-data/outputs/upload.md 방법대로 이미지 호스팅 업로드 →
   인스타그램 캐러셀 게시

각 단계에서 중단 조건에 해당하면 다음 단계로 진행하지 말고 텔레그램으로
무엇이 문제인지 알려줘. 전체 완료 시에도 결과(성공/실패, 게시 링크)를
텔레그램으로 요약해서 보내줘.

텔레그램 전송은 커넥터를 찾지 말고, 환경변수 TELEGRAM_BOT_TOKEN과
TELEGRAM_CHAT_ID를 이용해 curl로 Telegram Bot API를 직접 호출해서 보내줘.
```

---

## 5. 파일 구성 (프로젝트 폴더 기준)

```
project/
├── search.md                    # 1단계: 자료조사
├── message.md                   # 2단계: 텔레그램 승인
├── style.md                     # 3단계: 카드뉴스 제작 + QA
├── upload.md                    # 4단계: 인스타 게시
├── assemble.md                  # 이 문서 — 전체 오케스트레이션
└── finance_card_template.html   # 실제 사용 템플릿
```

---

## 6. 전체 실행 전 최종 체크리스트

아직 실제 값이 채워지지 않은, 반드시 확인해야 하는 항목만 모음:

- [x] 텔레그램 봇 토큰/chat_id 환경변수 등록 (message.md 5번 참고)
- [x] Instagram 장기 액세스 토큰 + 비즈니스 계정 ID 발급 및 환경변수 등록 (upload.md 6번 참고)
- [x] 이미지 호스팅 계정 준비 (upload.md 6번 참고)
- [x] Puppeteer/Playwright가 예약 작업 환경에서 정상 실행되는지 1회 테스트 (style.md 8번 참고) — 확인 완료 (Node.js v22, npm 10.9, headless Chromium 스크린샷 성공)
- [ ] 위 조건이 모두 충족되면, 실제 게시 전 비공개/테스트 계정으로 1회 시험 실행 권장
