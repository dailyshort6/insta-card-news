# message.md — 메신저 승인 자동화 스펙 (2단계)

search.md가 만든 "주제 후보 3개"를 텔레그램으로 전송하고,
본인이 답장으로 하나를 선택하면 그 주제를 3단계(style.md)로 넘기는 단계.

---

## 1. 입력

search.md 출력 형식 그대로 받는다:

```markdown
# {날짜} 카드뉴스 주제 후보

## 후보 1: {주제}
- 근거: ...
- 후킹 포인트: ...
- 형식 제안: ...

## 후보 2: {주제}
...

## 후보 3: {주제}
...
```

---

## 2. 텔레그램 전송 포맷

**중요**: 텔레그램 전송은 MCP 커넥터가 아니라, 환경변수(`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)를 이용한 **직접 HTTP 요청(curl 등)**으로 처리한다. "텔레그램 커넥터를 찾아서 연결"하려 하지 말 것 — 그런 커넥터는 설치되어 있지 않다. 아래처럼 Telegram Bot API를 직접 호출하면 된다:

```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d chat_id="${TELEGRAM_CHAT_ID}" \
  -d text="여기에 메시지 내용"
```

숫자로 답장하기 쉽게 번호를 강조해서 보낸다:

```
📋 오늘의 카드뉴스 주제 후보 ({날짜})

1️⃣ {주제1}
   근거: {근거1}
   후킹: {후킹포인트1}

2️⃣ {주제2}
   근거: {근거2}
   후킹: {후킹포인트2}

3️⃣ {주제3}
   근거: {근거3}
   후킹: {후킹포인트3}

→ 숫자(1/2/3)로 답장해주세요.
```

---

## 3. 승인 응답 대기 및 처리

- 사용자가 "1", "2", "3" 중 하나로 답장 (또는 수정 요청 텍스트)
- 숫자 응답이면 → 해당 후보를 선택된 주제로 확정
- 숫자가 아니면 → 자유 텍스트를 요청/피드백으로 간주하고, 그 피드백 반영한 새 후보를 다시 3개 생성해 재전송 (최대 2회 재시도, 이후엔 사람이 직접 개입)

## 4. 출력 (3단계 style.md로 전달)

```json
{
  "date": "{날짜}",
  "selected_topic": "{확정된 주제}",
  "hook": "{후킹 포인트}",
  "format": "{형식 제안}"
}
```

이 JSON이 3단계(style.md, 카드뉴스 작성)의 입력이 된다.

---

## 5. 확정된 사항 / 남은 조치

- **텔레그램 봇 토큰**: 발급 완료
- **남은 조치**: 발급받은 토큰과 chat_id를 코드에 직접 쓰지 말고, 프로젝트의 환경변수(`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)로 등록해두기 — 아직 등록 안 하셨다면 이 부분만 하시면 됨
- chat_id를 모르면: 봇과 대화 한 번 시작한 뒤 `https://api.telegram.org/bot{TOKEN}/getUpdates` 호출해서 확인

## 6. 참고 스크립트 예시 (Python, 개념 확인용)

```python
import os
import requests
import time

TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

def send_message(text):
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    requests.post(url, json={"chat_id": CHAT_ID, "text": text})

def wait_for_reply(timeout_sec=3600):
    url = f"https://api.telegram.org/bot{TOKEN}/getUpdates"
    start = time.time()
    last_update_id = None
    while time.time() - start < timeout_sec:
        resp = requests.get(url, params={"offset": last_update_id}).json()
        for update in resp.get("result", []):
            last_update_id = update["update_id"] + 1
            msg = update.get("message", {}).get("text")
            if msg:
                return msg.strip()
        time.sleep(10)
    return None  # 타임아웃 — 사람 개입 필요
```

이 코드는 상시 구동 환경(PC/서버)에서 실행되는 스크립트 기준이며,
Claude Code 예약 작업 안에서 직접 호출하려면 이 로직을 프로젝트 안의 실행 가능한 스크립트 파일로 넣어두고
지침에서 "이 스크립트를 실행해서 전송해줘"라고 참조해야 한다.

## 7. 남은 실행 전 조치
- 토큰/chat_id를 프로젝트 환경변수로 등록 (위 5번 참고)
- Claude Code 예약 작업 환경에서 이 스크립트(또는 동등한 텔레그램 전송 로직)를 실행할 권한이 있는지 한 번 테스트 실행으로 확인
