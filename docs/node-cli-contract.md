# Node CLI 연동 계약 초안

정적 웹 데모의 처리 흐름을 실제 Visual FoxPro ERP에 붙일 때 사용할 수 있는 명령행 인터페이스 초안입니다.

## 호출 예

```powershell
node cli.js `
  --job "JOB-20260716-001" `
  --input1 "C:\ERP\PDF\A.pdf" `
  --input2 "C:\ERP\PDF\B.pdf" `
  --input3 "C:\ERP\PDF\C.pdf" `
  --output "C:\ERP\MERGED\JOB-20260716-001.pdf" `
  --mode secure `
  --dpi 150
```

## 종료 코드 제안

| 코드 | 의미 |
|---:|---|
| 0 | 성공 |
| 10 | 입력 파일 누락 또는 경로 오류 |
| 11 | 입력 파일 개수/순서 오류 |
| 20 | PDF 읽기 또는 병합 실패 |
| 30 | 페이지 이미지화 실패 |
| 40 | 출력 파일 저장 실패 |
| 50 | 작업 이력 저장 실패 |
| 99 | 처리되지 않은 오류 |

## 결과 JSON 제안

출력 PDF 옆에 `<jobId>.result.json`을 생성하면 FoxPro UI에서 상세 이력을 읽기 쉽습니다.

```json
{
  "jobId": "JOB-20260716-001",
  "success": true,
  "output": "C:\\ERP\\MERGED\\JOB-20260716-001.pdf",
  "mode": "secure",
  "pageCount": 7,
  "outputBytes": 4839201,
  "elapsedMs": 2860,
  "completedAt": "2026-07-16T11:30:20+09:00"
}
```
