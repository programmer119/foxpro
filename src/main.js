import './styles.css';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/build/pdf.js';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_FILES = 3;
const MAX_TOTAL_BYTES = 150 * 1024 * 1024;
const MAX_TOTAL_PAGES = 120;

const state = {
  files: [],
  mode: 'secure',
  dpi: 150,
  quality: 0.88,
  busy: false,
  history: loadHistory(),
};

const app = document.querySelector('#app');
app.innerHTML = `
  <main class="shell">
    <header class="topbar">
      <div class="brand">
        <div class="brand-mark">ERP</div>
        <div>
          <h1>PDF Secure Merge</h1>
          <p>Visual FoxPro ERP 연동 사전 체험 데모 · Large UI</p>
        </div>
      </div>
      <div class="badge"><span class="badge-dot"></span>브라우저 내부 처리</div>
    </header>

    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">Visual FoxPro Integration Prototype</div>
        <h2>ERP에서 호출하면<br><span>병합·이미지화·저장</span>까지</h2>
        <p>실제 납품 환경에서는 Visual FoxPro ERP의 함수 호출로 로컬 Node 모듈이 실행됩니다. 이 페이지는 동일한 PDF 처리 결과를 서버 전송 없이 브라우저에서 먼저 체험하도록 만든 정적 데모입니다.</p>
        <div class="hero-points">
          <span class="hero-point">PDF 3개 고정 순서 병합</span>
          <span class="hero-point">텍스트 선택 방지 이미지형 PDF</span>
          <span class="hero-point">처리 이력 UI</span>
          <span class="hero-point">GitHub Pages 정적 배포</span>
        </div>
      </div>

      <div class="terminal" aria-label="연동 처리 로그">
        <div class="terminal-head"><span>ERP Integration Console</span><div class="dots"><i></i><i></i><i></i></div></div>
        <div class="terminal-body" id="terminal">
          <div class="terminal-line"><span class="dim">// 실제 납품 구조 예시</span></div>
          <div class="terminal-line"><span class="prompt">VFP&gt;</span> MergeSecurePdf(jobId, pdf1, pdf2, pdf3)</div>
          <div class="terminal-line"><span class="dim">     └─ local Node processor 실행</span></div>
          <div class="terminal-line"><span class="dim">     └─ 병합 순서 검증</span></div>
          <div class="terminal-line"><span class="dim">     └─ 각 페이지 이미지 렌더링</span></div>
          <div class="terminal-line"><span class="dim">     └─ 결과 PDF 및 작업 이력 저장</span></div>
          <div class="terminal-line"><span class="ok">READY</span> PDF 3개를 선택해 주세요.</div>
        </div>
      </div>
    </section>

    <section class="panel flow-panel">
      <div class="section-head">
        <div><h3>실제 운영 연동 흐름</h3><p>정적 데모에서는 같은 처리 엔진을 브라우저가 대신 실행합니다.</p></div>
      </div>
      <div class="flow">
        <div class="flow-step" data-step="vfp"><div class="flow-icon">VFP</div><strong>Visual FoxPro ERP</strong><span>업무 화면에서 처리 함수 호출</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step" data-step="node"><div class="flow-icon">JS</div><strong>Node 모듈 실행</strong><span>파일 경로와 작업번호 전달</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step" data-step="merge"><div class="flow-icon">3:1</div><strong>PDF 병합·이미지화</strong><span>정해진 순서로 스캔형 PDF 생성</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step" data-step="save"><div class="flow-icon">OK</div><strong>결과 저장·이력</strong><span>완료 상태와 파일 정보 기록</span></div>
      </div>
    </section>

    <section class="workspace">
      <div class="panel">
        <div class="section-head">
          <div><h3>PDF 3개 선택</h3><p>드래그해서 순서를 바꾸거나 화살표 버튼으로 조정할 수 있습니다.</p></div>
          <button class="btn btn-danger" id="clearBtn" type="button">전체 삭제</button>
        </div>

        <div class="dropzone" id="dropzone">
          <div class="drop-icon">＋</div>
          <h4>PDF 파일을 여기에 놓으세요</h4>
          <p>최대 3개 · 합계 150MB · 파일은 외부 서버로 전송되지 않습니다.</p>
          <div class="button-row">
            <button class="btn btn-primary" id="pickBtn" type="button">PDF 선택</button>
            <button class="btn btn-secondary" id="sampleBtn" type="button">샘플 3개 불러오기</button>
          </div>
          <input id="fileInput" type="file" accept="application/pdf,.pdf" multiple hidden />
        </div>

        <div class="empty-slots" id="emptySlots">
          <div class="empty-slot">1번 문서</div><div class="empty-slot">2번 문서</div><div class="empty-slot">3번 문서</div>
        </div>
        <div class="file-list" id="fileList"></div>

        <div class="progress-wrap" id="progressWrap">
          <div class="progress-head"><span id="progressTitle">처리 준비</span><strong id="progressPercent">0%</strong></div>
          <div class="progress-track"><div class="progress-bar" id="progressBar"></div></div>
          <div class="status-text" id="statusText">대기 중</div>
        </div>

        <div class="history">
          <div class="section-head"><div><h3>최근 처리 이력</h3><p>데모 브라우저에 작업 메타데이터만 저장됩니다.</p></div></div>
          <div class="history-list" id="historyList"></div>
        </div>
      </div>

      <aside class="panel">
        <div class="section-head"><div><h3>처리 설정</h3><p>납품 모듈에서 옵션화할 수 있는 항목입니다.</p></div></div>
        <div class="settings">
          <div class="setting-group">
            <label>출력 방식</label>
            <div class="segment" id="modeSegment">
              <button class="selected" data-mode="secure" type="button">이미지형 PDF</button>
              <button data-mode="normal" type="button">일반 병합</button>
            </div>
          </div>
          <div class="setting-group" id="dpiGroup">
            <label for="dpiSelect">이미지 해상도</label>
            <select id="dpiSelect">
              <option value="120">120 DPI · 빠른 확인</option>
              <option value="150" selected>150 DPI · 권장</option>
              <option value="200">200 DPI · 고품질</option>
            </select>
          </div>
          <div class="setting-group" id="qualityGroup">
            <label for="qualitySelect">압축 품질</label>
            <select id="qualitySelect">
              <option value="0.8">보통 · 파일 작게</option>
              <option value="0.88" selected>높음 · 권장</option>
              <option value="0.94">최고 · 파일 크게</option>
            </select>
          </div>

          <div class="function-card">
            <div class="label">Visual FoxPro 호출 예시</div>
            <div class="function-code" id="functionCode">MergeSecurePdf("JOB-READY", "PDF_1", "PDF_2", "PDF_3")</div>
          </div>
        </div>

        <div class="action-area">
          <button class="btn btn-primary" id="runBtn" type="button" disabled>ERP 함수 호출 체험</button>
          <button class="btn btn-ghost" id="resetFlowBtn" type="button">연동 흐름 초기화</button>
          <div class="note"><span>●</span><span><strong>데모:</strong> 브라우저에서 직접 처리<br><strong>납품:</strong> FoxPro → 로컬 Node 실행 → 지정 경로 자동 저장</span></div>
        </div>
      </aside>
    </section>

    <footer class="footer">
      <span>Prototype for Visual FoxPro ERP PDF automation</span>
      <span>정적 페이지 · 업로드 서버 없음 · 로컬 브라우저 처리</span>
    </footer>
  </main>
  <div class="toast" id="toast" role="status"></div>
`;

const els = {
  dropzone: document.querySelector('#dropzone'),
  fileInput: document.querySelector('#fileInput'),
  pickBtn: document.querySelector('#pickBtn'),
  sampleBtn: document.querySelector('#sampleBtn'),
  clearBtn: document.querySelector('#clearBtn'),
  fileList: document.querySelector('#fileList'),
  emptySlots: document.querySelector('#emptySlots'),
  runBtn: document.querySelector('#runBtn'),
  resetFlowBtn: document.querySelector('#resetFlowBtn'),
  modeSegment: document.querySelector('#modeSegment'),
  dpiSelect: document.querySelector('#dpiSelect'),
  qualitySelect: document.querySelector('#qualitySelect'),
  dpiGroup: document.querySelector('#dpiGroup'),
  qualityGroup: document.querySelector('#qualityGroup'),
  functionCode: document.querySelector('#functionCode'),
  terminal: document.querySelector('#terminal'),
  progressWrap: document.querySelector('#progressWrap'),
  progressTitle: document.querySelector('#progressTitle'),
  progressPercent: document.querySelector('#progressPercent'),
  progressBar: document.querySelector('#progressBar'),
  statusText: document.querySelector('#statusText'),
  historyList: document.querySelector('#historyList'),
  toast: document.querySelector('#toast'),
};

els.pickBtn.addEventListener('click', () => els.fileInput.click());
els.fileInput.addEventListener('change', (event) => addFiles([...event.target.files]));
els.sampleBtn.addEventListener('click', loadSamples);
els.clearBtn.addEventListener('click', clearFiles);
els.runBtn.addEventListener('click', runProcessing);
els.resetFlowBtn.addEventListener('click', resetFlow);
els.dpiSelect.addEventListener('change', () => { state.dpi = Number(els.dpiSelect.value); });
els.qualitySelect.addEventListener('change', () => { state.quality = Number(els.qualitySelect.value); });
els.modeSegment.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-mode]');
  if (!button || state.busy) return;
  state.mode = button.dataset.mode;
  [...els.modeSegment.querySelectorAll('button')].forEach((item) => item.classList.toggle('selected', item === button));
  const secure = state.mode === 'secure';
  els.dpiGroup.style.display = secure ? '' : 'none';
  els.qualityGroup.style.display = secure ? '' : 'none';
  updateFunctionCode();
});

['dragenter', 'dragover'].forEach((name) => els.dropzone.addEventListener(name, (event) => {
  event.preventDefault();
  els.dropzone.classList.add('drag');
}));
['dragleave', 'drop'].forEach((name) => els.dropzone.addEventListener(name, (event) => {
  event.preventDefault();
  els.dropzone.classList.remove('drag');
}));
els.dropzone.addEventListener('drop', (event) => addFiles([...event.dataTransfer.files]));

function addFiles(incoming) {
  if (state.busy) return;
  const pdfs = incoming.filter((file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
  if (!pdfs.length) return showToast('PDF 파일만 선택할 수 있습니다.', true);

  const previousCount = state.files.length;
  const merged = [...state.files, ...pdfs].slice(0, MAX_FILES);
  const totalSize = merged.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > MAX_TOTAL_BYTES) return showToast('선택한 파일의 합계가 150MB를 초과합니다.', true);

  state.files = merged;
  if (previousCount + pdfs.length > MAX_FILES) showToast('이 데모는 PDF 3개 단위로 처리합니다. 처음 3개만 담았습니다.');
  els.fileInput.value = '';
  renderFiles();
}

function clearFiles() {
  if (state.busy) return;
  state.files = [];
  renderFiles();
  resetProgress();
  resetFlow();
}

function renderFiles() {
  els.fileList.innerHTML = '';
  els.emptySlots.style.display = state.files.length ? 'none' : 'grid';

  state.files.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.draggable = true;
    card.dataset.index = String(index);
    card.innerHTML = `
      <div class="file-order">${index + 1}</div>
      <div class="file-meta"><div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div><div class="file-size">${formatBytes(file.size)}</div></div>
      <div class="file-actions">
        <button class="icon-btn" type="button" data-action="up" title="위로" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button class="icon-btn" type="button" data-action="down" title="아래로" ${index === state.files.length - 1 ? 'disabled' : ''}>↓</button>
        <button class="icon-btn" type="button" data-action="remove" title="삭제">×</button>
      </div>`;

    card.addEventListener('click', (event) => {
      const action = event.target.closest('button')?.dataset.action;
      if (!action || state.busy) return;
      if (action === 'remove') state.files.splice(index, 1);
      if (action === 'up' && index > 0) [state.files[index - 1], state.files[index]] = [state.files[index], state.files[index - 1]];
      if (action === 'down' && index < state.files.length - 1) [state.files[index + 1], state.files[index]] = [state.files[index], state.files[index + 1]];
      renderFiles();
    });
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
    card.addEventListener('dragover', (event) => event.preventDefault());
    card.addEventListener('drop', (event) => {
      event.preventDefault();
      const source = Number(document.querySelector('.file-card.dragging')?.dataset.index);
      const target = index;
      if (Number.isNaN(source) || source === target) return;
      const [moved] = state.files.splice(source, 1);
      state.files.splice(target, 0, moved);
      renderFiles();
    });
    els.fileList.append(card);
  });

  els.runBtn.disabled = state.files.length !== MAX_FILES || state.busy;
  updateFunctionCode();
}

function updateFunctionCode() {
  const job = state.files.length === 3 ? `JOB-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}` : 'JOB-READY';
  const names = [0, 1, 2].map((index) => state.files[index]?.name ?? `PDF_${index + 1}`);
  const fn = state.mode === 'secure' ? 'MergeSecurePdf' : 'MergePdf';
  els.functionCode.textContent = `${fn}("${job}", "${names[0]}", "${names[1]}", "${names[2]}")`;
}

async function loadSamples() {
  if (state.busy) return;
  setButtonBusy(els.sampleBtn, true, '생성 중...');
  try {
    const specs = [
      ['01_거래명세서.pdf', '거래명세서', 'ERP에서 생성된 첫 번째 업무 문서'],
      ['02_검사성적서.pdf', '검사성적서', '정해진 순서의 두 번째 업무 문서'],
      ['03_제품라벨.pdf', '제품 라벨', '병합 묶음의 마지막 첨부 문서'],
    ];
    state.files = [];
    for (let index = 0; index < specs.length; index += 1) {
      const [filename, title, subtitle] = specs[index];
      const bytes = await createSamplePdf(title, subtitle, index + 1);
      state.files.push(new File([bytes], filename, { type: 'application/pdf' }));
    }
    renderFiles();
    showToast('체험용 PDF 3개를 만들었습니다.');
  } catch (error) {
    console.error(error);
    showToast('샘플 PDF 생성에 실패했습니다.', true);
  } finally {
    setButtonBusy(els.sampleBtn, false, '샘플 3개 불러오기');
  }
}

async function createSamplePdf(title, subtitle, order) {
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0d203a';
  ctx.fillRect(0, 0, canvas.width, 230);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 64px sans-serif';
  ctx.fillText(title, 90, 128);
  ctx.font = '30px sans-serif';
  ctx.fillStyle = '#b9c9df';
  ctx.fillText('VISUAL FOXPRO ERP SAMPLE DOCUMENT', 90, 184);

  ctx.fillStyle = '#162b48';
  ctx.font = '700 38px sans-serif';
  ctx.fillText(`문서 순서 ${order} / 3`, 90, 350);
  ctx.font = '30px sans-serif';
  ctx.fillStyle = '#52657d';
  ctx.fillText(subtitle, 90, 410);

  const rows = [
    ['작업 번호', `DEMO-20260716-${String(order).padStart(2, '0')}`],
    ['생성 시스템', 'Visual FoxPro ERP'],
    ['처리 방식', 'Node PDF Processor 연동 예정'],
    ['보안 처리', '병합 후 페이지 이미지화'],
  ];
  let y = 530;
  for (const [label, value] of rows) {
    ctx.fillStyle = '#f3f6fa';
    ctx.fillRect(90, y, 1060, 105);
    ctx.fillStyle = '#6a7c92';
    ctx.font = '26px sans-serif';
    ctx.fillText(label, 125, y + 65);
    ctx.fillStyle = '#162b48';
    ctx.font = '700 27px sans-serif';
    ctx.fillText(value, 420, y + 65);
    y += 125;
  }
  ctx.strokeStyle = '#d7e0eb';
  ctx.lineWidth = 3;
  ctx.strokeRect(90, 1120, 1060, 380);
  ctx.fillStyle = '#7a8ba1';
  ctx.font = '28px sans-serif';
  ctx.fillText('이 문서는 고객 체험용으로 브라우저에서 즉시 생성되었습니다.', 135, 1230);
  ctx.fillText('실제 문서는 ERP에서 생성된 PDF 경로를 자동 전달받아 처리합니다.', 135, 1290);
  ctx.fillStyle = '#2868ff';
  ctx.font = '700 32px sans-serif';
  ctx.fillText('PDF SECURE MERGE DEMO', 135, 1420);

  const pngBlob = await canvasToBlob(canvas, 'image/png');
  const pdf = await PDFDocument.create();
  const image = await pdf.embedPng(await pngBlob.arrayBuffer());
  const page = pdf.addPage([595.28, 841.89]);
  page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
  return pdf.save();
}

async function runProcessing() {
  if (state.busy || state.files.length !== MAX_FILES) return;
  state.busy = true;
  renderFiles();
  setControlsDisabled(true);
  resetFlow();
  els.progressWrap.classList.add('visible');

  const startedAt = performance.now();
  const outputName = makeOutputName();
  try {
    await runFlowStep('vfp', 8, 'Visual FoxPro에서 병합 함수 호출');
    appendTerminal(`<span class="prompt">VFP&gt;</span> ${escapeHtml(els.functionCode.textContent)}`);
    await runFlowStep('node', 14, 'Node 처리 모듈 실행 및 입력 검증');
    appendTerminal(`<span class="ok">SPAWN</span> local pdf-processor --job ${makeJobId()}`);

    setFlow('merge', 'active');
    let outputBytes;
    if (state.mode === 'secure') {
      outputBytes = await rasterizeAndMerge(state.files, updateProgress);
    } else {
      outputBytes = await mergeNormally(state.files, updateProgress);
    }
    setFlow('merge', 'done');

    await runFlowStep('save', 96, '결과 PDF 생성 및 작업 이력 저장');
    downloadBytes(outputBytes, outputName);
    const elapsed = Math.max(0.1, (performance.now() - startedAt) / 1000);
    addHistory({
      name: outputName,
      mode: state.mode === 'secure' ? `이미지형 · ${state.dpi} DPI` : '일반 병합',
      size: outputBytes.byteLength,
      elapsed,
      createdAt: new Date().toISOString(),
    });
    updateProgress(100, '완료', `${formatBytes(outputBytes.byteLength)} · ${elapsed.toFixed(1)}초`);
    appendTerminal(`<span class="ok">SUCCESS</span> ${escapeHtml(outputName)} (${formatBytes(outputBytes.byteLength)})`);
    showToast('병합 PDF를 생성했습니다. 다운로드가 시작됩니다.');
  } catch (error) {
    console.error(error);
    appendTerminal(`<span class="warn">ERROR</span> ${escapeHtml(error.message || String(error))}`);
    updateProgress(0, '처리 실패', error.message || 'PDF 처리 중 오류가 발생했습니다.');
    resetFlow('error');
    showToast(error.message || 'PDF 처리에 실패했습니다.', true);
  } finally {
    state.busy = false;
    setControlsDisabled(false);
    renderFiles();
  }
}

async function mergeNormally(files, onProgress) {
  const output = await PDFDocument.create();
  let completed = 0;
  for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
    const file = files[fileIndex];
    onProgress(20 + fileIndex * 20, 'PDF 병합 중', `${fileIndex + 1}/3 · ${file.name}`);
    const source = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: false });
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));
    completed += pages.length;
    if (completed > MAX_TOTAL_PAGES) throw new Error(`데모 처리 한도 ${MAX_TOTAL_PAGES}페이지를 초과했습니다.`);
  }
  onProgress(86, '최종 PDF 저장 중', `총 ${completed}페이지`);
  return output.save();
}

async function rasterizeAndMerge(files, onProgress) {
  const output = await PDFDocument.create();
  const scale = state.dpi / 72;
  let totalPages = 0;
  const documents = [];

  onProgress(18, '페이지 수 확인 중', '입력 PDF 구조를 분석합니다.');
  for (const file of files) {
    const data = new Uint8Array(await file.arrayBuffer());
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    totalPages += pdf.numPages;
    if (totalPages > MAX_TOTAL_PAGES) {
      await pdf.destroy();
      throw new Error(`데모 처리 한도 ${MAX_TOTAL_PAGES}페이지를 초과했습니다.`);
    }
    documents.push({ file, pdf });
  }

  let currentPage = 0;
  try {
    for (const { file, pdf } of documents) {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        currentPage += 1;
        const progress = 22 + Math.round((currentPage / totalPages) * 64);
        onProgress(progress, '페이지 이미지화 중', `${currentPage}/${totalPages} · ${file.name}`);

        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d', { alpha: false });
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport }).promise;

        const jpegBlob = await canvasToBlob(canvas, 'image/jpeg', state.quality);
        const jpeg = await output.embedJpg(await jpegBlob.arrayBuffer());
        const outputPage = output.addPage([baseViewport.width, baseViewport.height]);
        outputPage.drawImage(jpeg, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
        page.cleanup();
        canvas.width = 1;
        canvas.height = 1;
      }
    }
  } finally {
    await Promise.all(documents.map(({ pdf }) => pdf.destroy()));
  }
  onProgress(89, '이미지형 PDF 저장 중', `총 ${totalPages}페이지`);
  return output.save({ useObjectStreams: true });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('페이지 이미지 변환에 실패했습니다.')), type, quality);
  });
}

async function runFlowStep(step, percent, status) {
  setFlow(step, 'active');
  updateProgress(percent, status, '연동 절차를 시뮬레이션합니다.');
  await delay(380);
  setFlow(step, 'done');
}

function setFlow(step, status) {
  const element = document.querySelector(`[data-step="${step}"]`);
  if (!element) return;
  element.classList.remove('active', 'done');
  if (status) element.classList.add(status);
}

function resetFlow(type) {
  document.querySelectorAll('.flow-step').forEach((step) => step.classList.remove('active', 'done'));
  if (type !== 'error') return;
}

function updateProgress(percent, title, detail) {
  els.progressWrap.classList.add('visible');
  els.progressBar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  els.progressPercent.textContent = `${Math.round(percent)}%`;
  els.progressTitle.textContent = title;
  els.statusText.textContent = detail;
}

function resetProgress() {
  els.progressWrap.classList.remove('visible');
  updateProgress(0, '처리 준비', '대기 중');
  els.progressWrap.classList.remove('visible');
}

function setControlsDisabled(disabled) {
  els.pickBtn.disabled = disabled;
  els.sampleBtn.disabled = disabled;
  els.clearBtn.disabled = disabled;
  els.dpiSelect.disabled = disabled;
  els.qualitySelect.disabled = disabled;
  [...els.modeSegment.querySelectorAll('button')].forEach((button) => { button.disabled = disabled; });
}

function appendTerminal(html) {
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.innerHTML = html;
  els.terminal.append(line);
  while (els.terminal.children.length > 11) els.terminal.firstElementChild.remove();
  els.terminal.scrollTop = els.terminal.scrollHeight;
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function addHistory(item) {
  state.history.unshift(item);
  state.history = state.history.slice(0, 5);
  localStorage.setItem('erp-pdf-demo-history', JSON.stringify(state.history));
  renderHistory();
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('erp-pdf-demo-history') || '[]'); }
  catch { return []; }
}

function renderHistory() {
  if (!state.history.length) {
    els.historyList.innerHTML = '<div class="history-empty">아직 처리한 문서가 없습니다.</div>';
    return;
  }
  els.historyList.innerHTML = state.history.map((item) => `
    <div class="history-item">
      <div class="history-status">✓</div>
      <div class="history-main"><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.mode)} · ${item.elapsed.toFixed(1)}초 · ${formatDate(item.createdAt)}</span></div>
      <div class="history-size">${formatBytes(item.size)}</div>
    </div>`).join('');
}

function makeOutputName() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `ERP_보안병합_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.pdf`;
}
function makeJobId() { return `JOB-${Date.now().toString(36).toUpperCase()}`; }
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}
function formatDate(value) {
  return new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
function setButtonBusy(button, busy, label) { button.disabled = busy; button.textContent = label; }
let toastTimer;
function showToast(message, error = false) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.toggle('error', error);
  els.toast.classList.add('visible');
  toastTimer = setTimeout(() => els.toast.classList.remove('visible'), 3200);
}

renderFiles();
renderHistory();
