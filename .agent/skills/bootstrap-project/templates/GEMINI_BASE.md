# SasolLabs 전역 가이드라인

## 🔄 Closing Loop 핵심 철학

> **AI 코드 생성 → 검증 → 에러 → AI 피드백 → 수정 반복**

| 원칙 | 설명 |
|------|------|
| **Integration Test 중심** | 입력→출력만 검증 (내부 구현 ❌) |
| **에러 → AI 피드백** | 직접 수정 금지, AI에게 에러 로그 전달 |
| **Unit Test 최소화** | 복잡 비즈니스 로직에만 사용 |

---

## 🔧 Closing Loop 실행

```bash
# 매 수정 시
./verify.sh

# 커밋 전 전체 검증
./verify.sh --full
```

### 검증 레벨

| 레벨 | Frontend | Backend |
|:---:|:---------|:--------|
| L1 | `flutter analyze` | `./gradlew compileJava` |
| **L2** | **Widget Tests** (test/goldens/) | **Controller Integration Tests** |
| L3 | `flutter build` (--full) | `./gradlew build` (--full) |

---

## 📋 Integration Test 템플릿

### BE Controller Test

```java
@WebMvcTest(XxxController.class)
@AutoConfigureMockMvc
class XxxControllerTest {
    @Autowired private MockMvc mockMvc;
    @MockBean private XxxService service;

    @Test
    @WithMockUser(username = "test@example.com")
    void getXxx_returns200() throws Exception {
        when(service.getXxx()).thenReturn(List.of(...));
        
        mockMvc.perform(get("/api/xxx"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isArray());
    }
}
```

### FE Widget Test

```dart
void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  testWidgets('화면 구조 검증', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    addTearDown(tester.view.reset);

    await tester.pumpWidget(/* 테스트 위젯 */);
    
    expect(find.text('Expected Text'), findsOneWidget);
  });
}
```

### FE Golden Test (시각적 레이아웃 검증)

```dart
void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  testWidgets('화면 스냅샷 일치', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(/* 테스트 앱 */);
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(XxxScreen),
      matchesGoldenFile('goldens/xxx_screen.png'),
    );
  });
}
```

**Golden 이미지 업데이트:** `flutter test --update-goldens test/goldens/xxx_golden_test.dart`

---

## 개발 시 적용 Skills

전역 스킬: `/sasollabs/.gemini/skills/` (심볼릭 링크로 참조)

| 상황 | Skill | 설명 |
|------|-------|------|
| 검증 철학 | @closing-loop | Closing Loop 핵심 원칙 |
| 프로젝트 시작 | @bootstrap-project | 새 프로젝트 초기화 |
| 버그 수정 | @systematic-debugging | 체계적 디버깅 |
| 새 기능 | @test-driven-development | TDD 워크플로우 |
| 코드 작성 | @clean-code | 클린 코드 원칙 |
| 커밋 | @git-pushing | Git 커밋 표준 |
| 설계 | @architecture, @api-patterns | 아키텍처/API 설계 |
| DB 관련 | @database-design | 데이터베이스 설계 |
| 코드 리뷰 | @code-review-checklist | 코드 리뷰 체크리스트 |

---

## ⚠️ 필수 규칙 (MANDATORY - 예외 없음)

### 🚨 코드 수정 후 자동 검증 (최우선)
> **모든 코드 수정 후 반드시 `./verify.sh` 실행**
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
1. **한글 대화**
2. **TODO 금지** - 코드 전부 구현
3. **레거시 제거** - 불필요한 코드 즉시 삭제

---

## 📊 Closing Loop 흐름

```
AI 코드 생성 → ./verify.sh → PASSED? → ✅ 완료
                    ↓
                 FAILED → 에러 로그 → AI 피드백 → 수정 → 반복
```
