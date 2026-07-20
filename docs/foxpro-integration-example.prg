* Visual FoxPro 연동 개념 예시
* 실제 ERP의 호출 위치, 경로 규칙, 오류 처리 방식에 맞춰 조정해야 합니다.

LPARAMETERS tcJobId, tcPdf1, tcPdf2, tcPdf3, tcOutput

LOCAL loShell, lcNodeExe, lcRunner, lcCommand, lnExitCode

lcNodeExe = FULLPATH("runtime\node.exe")
lcRunner  = FULLPATH("processor\cli.js")

lcCommand = '"' + lcNodeExe + '" "' + lcRunner + '"' + ;
    ' --job "' + tcJobId + '"' + ;
    ' --input1 "' + tcPdf1 + '"' + ;
    ' --input2 "' + tcPdf2 + '"' + ;
    ' --input3 "' + tcPdf3 + '"' + ;
    ' --output "' + tcOutput + '"' + ;
    ' --mode secure'

loShell = CREATEOBJECT("WScript.Shell")
lnExitCode = loShell.Run(lcCommand, 0, .T.)

DO CASE
CASE lnExitCode = 0
    RETURN .T.
CASE lnExitCode = 10
    MESSAGEBOX("입력 PDF를 찾을 수 없습니다.", 16, "PDF 병합 오류")
CASE lnExitCode = 20
    MESSAGEBOX("PDF 병합에 실패했습니다.", 16, "PDF 병합 오류")
CASE lnExitCode = 30
    MESSAGEBOX("이미지형 PDF 변환에 실패했습니다.", 16, "PDF 병합 오류")
OTHERWISE
    MESSAGEBOX("PDF 처리 중 알 수 없는 오류가 발생했습니다. 코드: " + TRANSFORM(lnExitCode), 16, "PDF 병합 오류")
ENDCASE

RETURN .F.
