# Visual FoxPro ERP PDF Secure Merge Demo — Large Clear UI

> 본문·버튼·처리 흐름·파일 목록을 대형 화면 기준으로 전면 확대한 버전입니다.

## Windows 실행

ZIP을 `C:\Users\srhsh\Downloads`에 압축 해제한 뒤 PowerShell에서 아래 두 줄을 실행합니다.

```powershell
cd "C:\Users\srhsh\Downloads\foxpro-pdf-secure-merge-demo-large-clear-20260719"
powershell -ExecutionPolicy Bypass -File .\install-and-run.ps1
```

실행 주소: `http://127.0.0.1:5173`

---

Visual FoxPro 기반 ERP에서 함수 호출로 로컬 Node 모듈이 실행되고, PDF 3개를 정해진 순서로 병합한 뒤 이미지형 PDF로 저장하는 흐름을 고객이 직접 체험하도록 만든 정적 웹 데모입니다.

## 데모 기능

- PDF 정확히 3개 선택
- 드래그 또는 버튼으로 병합 순서 변경
- 일반 PDF 병합
- PDF.js + Canvas 기반 페이지 이미지화
- 이미지형 PDF 재생성 및 다운로드
- Visual FoxPro → Node → 병합 → 저장 흐름 시각화
- 처리 진행률 및 최근 이력 UI
- 샘플 PDF 3개 즉시 생성
- 파일 외부 전송 없음

## 로컬 실행

```bash
npm install
npm run dev
```

배포용 빌드:

```bash
npm run build
npm run preview
```

## GitHub Pages 배포

1. 이 폴더를 새 GitHub 저장소의 `main` 브랜치에 올립니다.
2. 저장소 **Settings → Pages → Build and deployment → Source**에서 `GitHub Actions`를 선택합니다.
3. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드하고 배포합니다.

`vite.config.js`의 `base: './'` 설정으로 프로젝트 하위 경로와 커스텀 도메인에서 모두 상대 경로로 동작합니다.

## 커스텀 도메인

GitHub 저장소 **Settings → Pages → Custom domain**에 사용할 도메인을 입력합니다.

- 서브도메인 예: `pdf.example.com` → DNS에 `CNAME`을 만들고 `<github-id>.github.io`를 지정
- 루트 도메인 예: `example.com` → GitHub가 안내하는 `A/AAAA` 레코드 사용
- DNS 적용 후 **Enforce HTTPS** 활성화
- GitHub 계정 설정에서 도메인 검증 권장

커스텀 도메인을 저장하면 GitHub Pages가 배포 산출물에 CNAME 설정을 관리합니다. 별도 `public/CNAME` 파일을 직접 추가해도 됩니다.

## 실제 납품 버전 전환 구조

정적 데모:

```text
사용자 브라우저
  → PDF 3개 직접 선택
  → 브라우저 내부 병합·이미지화
  → 결과 다운로드
```

실제 ERP 연동:

```text
Visual FoxPro ERP
  → MergeSecurePdf(jobId, pdf1, pdf2, pdf3) 호출
  → 로컬 Node 실행파일/모듈 실행
  → PDF 병합·페이지 이미지화
  → 지정 폴더에 결과 저장
  → 종료 코드와 작업 이력 반환
```

브라우저 UI와 처리 로직은 사전 시연용이고, 납품 단계에서는 파일 선택·다운로드 부분을 FoxPro에서 전달한 로컬 경로 읽기·지정 경로 저장으로 교체합니다.

## 기술 구성

- Vite
- pdf-lib
- PDF.js (`pdfjs-dist`)
- Vanilla JavaScript / CSS

## 주의사항

이미지형 PDF는 텍스트 선택과 직접 편집을 어렵게 하지만 완전한 위변조 방지 수단은 아닙니다. 강한 무결성 검증이 필요하면 전자서명, 타임스탬프, 해시 검증을 별도 적용해야 합니다.
## GitHub Pages 배포

1. 저장소 `main` 브랜치에 이 폴더의 파일 전체를 업로드합니다.
2. GitHub 저장소에서 `Settings > Pages`로 이동합니다.
3. `Build and deployment > Source`를 `GitHub Actions`로 선택합니다.
4. `Actions` 탭에서 `Deploy static demo to GitHub Pages`가 성공했는지 확인합니다.
5. 커스텀 도메인은 `Settings > Pages > Custom domain`에 입력합니다.

커스텀 도메인을 소스에도 고정하려면 `public/CNAME.example`을 `public/CNAME`으로 이름을 변경하고 파일 내용에 도메인만 한 줄로 적습니다.
