---
description: 새 풀스택 프로젝트 환경 자동 설정 (Flutter + Spring Boot) - Closing Loop 철학 적용
---

# @bootstrap-project

새 프로젝트를 시작할 때 호출하여 **Closing Loop 철학**이 반영된 표준화된 개발 환경을 자동 설정합니다.

---

## 🔄 Closing Loop 핵심 철학

### AI 시대 검증 전략

> AI가 생성한 코드 → 검증 → 에러 → AI 피드백 → 수정 반복

| ❌ Unit Test | ✅ Integration Test |
|--------------|---------------------|
| 내부 구현 검증 | **입력 → 출력 검증** |
| AI 구조 변경 시 깨짐 | 결과만 맞으면 통과 |
| 최소화 | **핵심** |

### 검증 루프 실행

```bash
# 코드 수정 후 Closing Loop 실행
./verify.sh

# 에러 발생 시 → 에러 로그를 AI에게 피드백 → 수정 반복
```

**인간의 역할**: 직접 수정 ❌, AI에게 에러 피드백만!

---

## 📋 자동 생성 항목

### 1. verify.sh (Closing Loop 스크립트)

```bash
#!/bin/bash
set -e

echo "════════════════════════════════════════════════════"
echo "🔍 Closing Loop Verification"
echo "════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────
# LEVEL 1: Compile + Lint (에러 검출)
# ─────────────────────────────────────────────────────
echo "📱 [FE] Static Analysis..."
cd frontend && flutter analyze --no-fatal-infos
cd ..

echo "☕ [BE] Compile Check..."
cd backend && ./gradlew compileJava -q
cd ..

# ─────────────────────────────────────────────────────
# LEVEL 2: Integration Tests (핵심!)
# ─────────────────────────────────────────────────────
echo "☕ [BE] Controller Integration Tests..."
cd backend && ./gradlew test --tests "*ControllerTest" -q
cd ..

echo "📱 [FE] Widget Tests..."
cd frontend && flutter test test/goldens/ --reporter compact
cd ..

# ─────────────────────────────────────────────────────
# LEVEL 3: Build (--full 옵션 시)
# ─────────────────────────────────────────────────────
if [ "$1" == "--full" ]; then
  echo "📱 [FE] Build..."
  cd frontend && flutter build apk --debug
  cd ..
  
  echo "☕ [BE] Build..."
  cd backend && ./gradlew build -x test -q
  cd ..
fi

echo "✅ ALL CHECKS PASSED!"
```

**권한 설정 필수**: `chmod +x verify.sh`

---

### 2. 검증 레벨

| 레벨 | 시간 | Frontend | Backend |
|:---:|:----:|:---------|:--------|
| L1 | ~5초 | `flutter analyze` | `./gradlew compileJava` |
| **L2** | ~30초 | **Widget Tests** | **Controller Integration Tests** |
| L3 | ~1분 | `flutter build` (--full) | `./gradlew build` (--full) |

---

### 3. BE Controller Integration Test 템플릿

`backend/src/test/java/.../controller/XxxControllerTest.java`

```java
@WebMvcTest(XxxController.class)
@AutoConfigureMockMvc(addFilters = false)
class XxxControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private XxxService service;

    @Test
    @DisplayName("GET /api/xxx → 200 + 데이터 반환")
    void getXxx_returns200() throws Exception {
        // Given: Service 목 설정
        when(service.getXxx()).thenReturn(List.of(...));

        // When & Then: API 호출 → 응답 검증
        mockMvc.perform(get("/api/xxx"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
```

**철학**: 내부 로직 ❌, API 계약만 검증 ✅

---

### 4. FE Widget Test 템플릿

`frontend/test/goldens/xxx_screen_test.dart`

```dart
void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  group('[Screen] Widget Tests', () {
    testWidgets('화면 구조 검증', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      addTearDown(tester.view.reset);

      await tester.pumpWidget(/* 테스트 위젯 */);
      
      // Black-box 검증: 화면에 원하는 UI가 있는가?
      expect(find.text('Expected Text'), findsOneWidget);
    });
  });
}
```

---

### 5. FE Golden Test 템플릿 (시각적 레이아웃 검증)

`frontend/test/goldens/xxx_screen_golden_test.dart`

```dart
void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  group('[Screen] Golden Tests', () {
    void setupScreenSize(WidgetTester tester) {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);
    }

    testWidgets('화면 스냅샷 일치', (tester) async {
      setupScreenSize(tester);

      await tester.pumpWidget(/* 테스트 앱 */);
      await tester.pumpAndSettle();

      await expectLater(
        find.byType(XxxScreen),
        matchesGoldenFile('goldens/xxx_screen.png'),
      );
    });
  });
}
```

**Golden Test 워크플로우:**
```bash
# 골든 이미지 생성/업데이트
flutter test --update-goldens test/goldens/xxx_screen_golden_test.dart

# 검증 (verify.sh에 포함됨)
flutter test test/goldens/
```

---

### 6. 스킬 연결 (Monorepo 구조)

새 프로젝트 생성 시 monorepo의 공유 스킬을 참조하도록 심볼릭 링크 생성:

```bash
# 프로젝트 디렉토리에서 실행 (saesollabs/projects/[project-name]/)
mkdir -p .agent
ln -sf ../../../.agent/skills .agent/skills
```

**구조:**
```
saesollabs/
├── .agent/skills/          ← 공유 스킬 (Git 추적)
│   ├── firebase/
│   ├── gcp-cloud-run/
│   ├── testing-patterns/
│   └── ... (25개 선별 스킬)
└── projects/
    └── [new-project]/
        └── .agent/
            ├── skills → ../../../.agent/skills  ← 상대 심볼릭 링크
            └── workflows/                        ← 프로젝트별 워크플로우
```

**장점:**
- Git으로 스킬 목록 동기화
- 모든 프로젝트가 동일한 스킬 세트 사용
- 다른 머신에서 clone해도 상대 경로로 작동

---

### 7. GEMINI.md 복사 (필수!)

새 프로젝트 생성 시 **반드시** 상위 GEMINI.md를 프로젝트로 복사:

```bash
# 프로젝트 디렉토리에서 실행
mkdir -p .gemini
cp ../../../.gemini/GEMINI.md .gemini/GEMINI.md
```

**이유**: AI가 규칙을 놓치지 않도록 `user_rules`에 직접 주입됨

복사 후 프로젝트 특화 규칙 추가:
```markdown
## 🛠️ [프로젝트명] 기술 스택
- **Backend**: ...
- **Frontend**: ...

## 📋 [프로젝트명] 특화 규칙
- ...
```

---

### 8. 프로젝트 구조

```
[project-root]/
├── .gemini/
│   └── GEMINI.md                ← 상위 규칙 복사 + 프로젝트 특화 규칙
├── verify.sh                    ← Closing Loop 스크립트
├── frontend/
│   ├── test/goldens/            ← Widget Tests + Golden Tests
│   ├── goldens/                 ← Golden 이미지 저장소
│   └── integration_test/        ← E2E Tests (선택)
└── backend/
    └── src/test/
        └── controller/          ← Integration Tests
```

---

## ⚠️ 필수 규칙 (MANDATORY - 예외 없음)

### 🚨 코드 수정 후 자동 검증 (최우선)
> **모든 코드 수정 후 반드시 `./verify.sh` 실행**
> - ❌ `flutter analyze`나 `./gradlew compileJava` 단독 실행은 **검증으로 인정되지 않음**
> - ✅ 오직 `./verify.sh`만이 **유일한 검증 수단**
> - 🚨 **AI 수정, 사용자 수정 모두 포함** (예외 없음)
> - 🚨 사용자가 파일 diff를 보내면 **즉시 `./verify.sh` 실행**
> - 사용자 요청 없이도 **자동 실행**
> - "간단한 수정"도 예외 아님
> - PASSED 확인 후에만 완료 보고
> - FAILED 시 → 에러 분석 → 수정 → 다시 검증 (반복)


### 🧪 테스트 생성 규칙

**테스트 필수 대상:**
- 새 Controller/API 엔드포인트 → Controller Integration Test
- 새 Screen/주요 Widget → Widget Test (+ Golden Test)
- 새 비즈니스 로직 함수 → 관련 Integration Test
- **⚠️ 기존 화면에 새 UI 요소 추가 (메뉴, 버튼 등) → 기존 Golden Test 업데이트**

**테스트 생성 불필요:**
- 단순 스타일 변경 (색상, 패딩 등) - 단, 큰 레이아웃 변경은 Golden 업데이트 필요
- 기존 로직 내 마이너 수정
- 리팩토링 (동작 변경 없음)

**기존 테스트 수정:**
- 변경된 로직에 직접 영향받는 테스트만
- **UI 요소 추가/삭제 시 관련 Golden Test 반드시 업데이트**
- 관련 없는 테스트 변경 금지

### 기타 규칙
1. **Integration Test 중심** - Unit Test는 복잡 로직에만
2. **에러 → AI 피드백** - 직접 수정 금지
3. **한글 대화** - 모든 대화는 한글로
4. **TODO 금지** - 코드 전부 구현
5. **레거시 제거** - 불필요한 코드 즉시 삭제
6. **다국어** - 텍스트 수정 시 8개 언어 업데이트

---

## 📊 Closing Loop 흐름도

```
┌─────────────────────────────────────────────────────────┐
│  AI 코드 생성                                            │
│      ↓                                                   │
│  ./verify.sh 실행                                        │
│      ↓                                                   │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ Compile      │    │ Lint         │  ← L1 에러 검출    │
│  └──────┬───────┘    └──────┬───────┘                   │
│         └────────┬──────────┘                           │
│                  ↓                                       │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ BE Controller│    │ FE Widget    │  ← L2 Integration  │
│  │ Tests        │    │ Tests        │                    │
│  └──────┬───────┘    └──────┬───────┘                   │
│         └────────┬──────────┘                           │
│                  ↓                                       │
│         ┌────────────────┐                              │
│         │  PASSED?       │                              │
│         └───────┬────────┘                              │
│           ┌─────┴─────┐                                 │
│           ↓           ↓                                 │
│         ✅ 완료     ❌ 에러 → AI 피드백 → 반복           │
└─────────────────────────────────────────────────────────┘
```
