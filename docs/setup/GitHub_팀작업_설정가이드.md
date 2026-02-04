# GitHub 팀 작업 설정 가이드

## 1. 브랜치 보호 규칙 설정

### main 브랜치 보호 (필수)

**단계별 설정 방법:**

1. **"Add classic branch protection rule" 버튼 클릭**
   - 현재 페이지에서 보이는 파란색 버튼 클릭

2. **Branch name pattern 입력**
   - `main` 입력 (정확히 입력)

3. **Protect matching branches 섹션 설정**
   
   **필수 체크 항목:**
   - ✅ **Require a pull request before merging**
     - 하위 옵션:
       - ✅ **Require approvals**: `1` 입력 (최소 1명 승인 필요)
       - ✅ **Dismiss stale pull request approvals when new commits are pushed** (새 커밋이 푸시되면 기존 승인 무효화)
   
   **권장 체크 항목:**
   - ✅ **Require conversation resolution before merging** (PR에 코멘트가 있으면 해결 후 병합)
   - ✅ **Require linear history** (선택사항, 깔끔한 히스토리 유지)
   - ✅ **Do not allow bypassing the above settings** (관리자도 규칙 준수 - **중요!**)
   
   **선택사항:**
   - ⬜ **Require status checks to pass before merging** (CI/CD 사용 시만 체크)

4. **Restrict who can push to matching branches**
   - ✅ **Restrict pushes that create files larger than 100 MB** (선택사항)
   - 또는 "Restrict who can push to matching branches" 체크하여 특정 사용자만 허용 (일반적으로는 체크 안 함)

5. **Allow force pushes**
   - ❌ **체크 해제** (강제 푸시 방지 - **중요!**)

6. **Allow deletions**
   - ❌ **체크 해제** (브랜치 삭제 방지 - **중요!**)

7. **"Create" 버튼 클릭**
   - 설정 완료 후 하단의 "Create" 버튼 클릭

### ⚠️ "Name already protected: main" 에러가 나는 경우

이 에러는 `main` 브랜치에 이미 보호 규칙이 설정되어 있다는 의미입니다.

**해결 방법:**

1. **기존 규칙 확인 및 수정**
   - Settings → Branches 페이지로 돌아가기
   - "Branch protection rules" 섹션에서 `main` 브랜치 규칙이 보일 것입니다
   - 규칙 이름을 클릭하여 기존 설정 확인 및 수정

2. **기존 규칙 수정**
   - 규칙 이름 클릭
   - 필요한 설정 변경
   - "Save changes" 버튼 클릭

3. **Repository Rules 사용 중인 경우**
   - Settings → Rules → Rulesets에서 확인
   - Repository rules가 설정되어 있으면 그곳에서 관리

**확인 방법:**
- Settings → Branches에서 `main` 브랜치 규칙이 목록에 표시되는지 확인
- 규칙이 있다면 클릭하여 현재 설정 확인

### develop 브랜치 보호 (선택사항)

통합 테스트 브랜치도 보호하는 것을 권장합니다.

**설정 항목:**
- Branch name pattern: `develop`
- ✅ Require a pull request before merging
- ✅ Require approvals: `1`
- ✅ Allow force pushes: ❌ 체크 해제
- ✅ Allow deletions: ❌ 체크 해제

## 2. 협력자(Collaborators) 추가

Settings → Collaborators → "Add people" 클릭

각 팀원의 GitHub 사용자명을 입력하여 추가합니다.

**권한 설정:**
- **Write** 권한 권장 (브랜치 생성, PR 생성 가능)
- **Admin** 권한은 리더/백엔드 담당자에게만 부여

## 3. 브랜치 전략

```
main                      # 최종 배포 (PR 필수, 직접 push 금지)
└── develop               # 통합 테스트 (PR 권장)
    ├── feature/frontend
    ├── feature/ai-roadview
    ├── feature/ai-consulting
    ├── feature/engine
    └── feature/backend
```

### 워크플로우

1. **각자 feature 브랜치에서 작업**
   ```bash
   git checkout -b feature/frontend
   # 작업 후
   git push origin feature/frontend
   ```

2. **PR(Pull Request) 생성**
   - GitHub에서 "Compare & pull request" 클릭
   - `develop` 브랜치로 PR 생성
   - 리뷰어 지정 (백엔드 담당자 또는 팀 리더)

3. **리뷰 및 승인**
   - 코드 리뷰 후 승인
   - 승인 후 병합 (Merge pull request)

4. **develop → main 병합**
   - 모든 모듈 통합 완료 후
   - `develop` → `main` PR 생성
   - 최종 검토 후 병합

## 4. PR 템플릿 설정 (선택사항)

`.github/pull_request_template.md` 파일 생성:

```markdown
## 변경 사항
- [ ] 기능 추가
- [ ] 버그 수정
- [ ] 문서 수정
- [ ] 리팩토링

## 설명
<!-- 변경 사항에 대한 설명을 작성해주세요 -->

## 테스트
<!-- 테스트 방법 및 결과를 작성해주세요 -->

## 체크리스트
- [ ] 코드 리뷰 요청
- [ ] 테스트 완료
- [ ] 문서 업데이트 (필요 시)
```

## 5. 이슈 템플릿 설정 (선택사항)

`.github/ISSUE_TEMPLATE/bug_report.md` 생성:

```markdown
---
name: 버그 리포트
about: 버그를 발견했을 때 사용
title: '[BUG] '
labels: bug
assignees: ''
---

## 버그 설명
<!-- 버그에 대한 명확한 설명 -->

## 재현 방법
1. 
2. 
3. 

## 예상 동작
<!-- 예상했던 동작 -->

## 실제 동작
<!-- 실제로 발생한 동작 -->

## 스크린샷
<!-- 가능하면 스크린샷 첨부 -->
```

## 6. 권장 설정 요약

### 필수 설정
- ✅ `main` 브랜치 보호 규칙
- ✅ 협력자 추가
- ✅ PR 필수 설정

### 선택 설정
- `develop` 브랜치 보호 규칙
- PR 템플릿
- 이슈 템플릿
- CI/CD 설정 (Actions)

## 7. 팀원 안내

설정 완료 후 팀원들에게 다음을 안내:

1. **브랜치 전략**
   - 각자 `feature/<역할>` 브랜치에서 작업
   - `main`에 직접 push 금지

2. **PR 워크플로우**
   - 작업 완료 후 PR 생성
   - 리뷰어 지정 필수
   - 승인 후 병합

3. **커밋 메시지 규칙**
   ```
   [Frontend] 브랜드 선택 UI 구현
   [AI-Roadview] Gemini Vision 로드뷰 분석 연동
   [Backend] 상권 분석 모듈 구현
   ```

## 참고

- GitHub 공식 문서: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches
- 브랜치 보호 규칙은 저장소 Settings에서만 설정 가능 (저장소 관리자 권한 필요)
