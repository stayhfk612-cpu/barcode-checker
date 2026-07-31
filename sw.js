<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, interactive-widget=resizes-content">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="バーコード検索">
  <meta name="theme-color" content="#0a0a0f">
  <title>Barcode-Finder</title>
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icons/icon-180.png">
  <link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jsQR/1.4.0/jsQR.min.js"></script>
  <style>
    :root {
      --bg:        #0a0a0f;
      --surface:   #12121c;
      --border:    #1e1e30;
      --accent:    #00d4ff;
      --accent2:   #0099cc;
      --ok:        #00ff88;
      --ok-dim:    #00cc6a;
      --ng:        #ff3b5c;
      --ng-dim:    #cc2244;
      --text:      #e8e8f0;
      --muted:     #5a5a78;
      --card-r:    11px;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic UI', system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      overscroll-behavior: none;
      overflow: hidden;
    }

    /* ─── Layout ─── */
    .app {
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 100dvh;
      height: 100vh; /* fallback */
      padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
    }

    /* ─── Header ─── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 11px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .header-icon {
      width: 16px; height: 16px;
      background: linear-gradient(135deg, var(--accent2), var(--accent));
      border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px;
      flex-shrink: 0;
    }
    .header h1 {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: var(--text);
    }
    .build-tag {
      font-size: 7px;
      font-weight: 600;
      color: var(--muted);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1px 5px;
      letter-spacing: 0.03em;
    }
    .step-badge {
      font-size: 7.5px;
      font-weight: 600;
      color: var(--accent);
      background: rgba(0,212,255,0.1);
      border: 1px solid rgba(0,212,255,0.25);
      border-radius: 11px;
      padding: 1px 6px;
      letter-spacing: 0.05em;
    }

    /* ─── Main scrollable area ─── */
    .main {
      flex: 1;
      overflow-y: auto;
      padding: 9px 11px 8px;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    /* ─── Pinned hero (常に最上部に固定) ─── */
    .hero-fixed {
      flex-shrink: 0;
      padding: 8px 11px 2px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: var(--bg);
    }

    /* ─── Toggles ─── */
    .mode-toggle {
      display: flex;
      gap: 5px;
      flex-shrink: 0;
    }
    .mode-btn {
      flex: 1;
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: 6px;
      padding: 3px 4px;
      color: var(--muted);
      font-family: inherit;
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.02em;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0px;
      line-height: 1.2;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .mode-btn-sub {
      font-size: 6px;
      font-weight: 500;
      letter-spacing: 0;
      color: var(--muted);
      opacity: 0.85;
    }
    .mode-btn.active {
      border-color: var(--accent);
      background: rgba(0,212,255,0.08);
      color: var(--accent);
    }
    .mode-btn.active .mode-btn-sub { color: var(--accent); opacity: 0.75; }
    .mode-btn:active { transform: scale(0.97); }
    .mode-toggle.locked .mode-btn {
      opacity: 0.45;
      pointer-events: none;
    }
    /* 状態トグル（登録/照合）は緑系で区別 */
    .state-toggle .mode-btn.active {
      border-color: var(--ok);
      background: rgba(0,255,136,0.08);
      color: var(--ok);
    }
    .state-toggle .mode-btn.active .mode-btn-sub { color: var(--ok); }

    /* ─── Result panel (hero) ─── */
    .result-panel {
      border-radius: var(--card-r);
      border: 2px solid var(--border);
      background: var(--surface);
      padding: 7px 11px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
      flex-shrink: 0;
    }
    .result-panel.ok {
      background: rgba(0,255,136,0.08);
      border-color: var(--ok);
      box-shadow: 0 0 24px rgba(0,255,136,0.18);
    }
    .result-panel.ng {
      background: rgba(255,59,92,0.08);
      border-color: var(--ng);
      box-shadow: 0 0 24px rgba(255,59,92,0.18);
    }
    .result-panel.reg {
      background: rgba(0,212,255,0.08);
      border-color: var(--accent);
      box-shadow: 0 0 20px rgba(0,212,255,0.15);
    }
    .result-label {
      font-size: 7.5px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .result-value {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.1;
      color: var(--muted);
      transition: color 0.25s;
    }
    .result-panel.ok  .result-value { color: var(--ok); }
    .result-panel.ng  .result-value { color: var(--ng); }
    .result-panel.reg .result-value { color: var(--accent); }

    .result-icon-wrap {
      width: 25px; height: 25px;
      border-radius: 50%;
      background: var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px;
      transition: background 0.25s;
      flex-shrink: 0;
    }
    .result-panel.ok  .result-icon-wrap { background: rgba(0,255,136,0.15); }
    .result-panel.ng  .result-icon-wrap { background: rgba(255,59,92,0.15); }
    .result-panel.reg .result-icon-wrap { background: rgba(0,212,255,0.15); }

    /* ─── Match detail ─── */
    .match-detail {
      font-size: 9px;
      padding: 7px 9px;
      border-radius: 7px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      line-height: 1.5;
      display: none;
      word-break: break-all;
    }
    .match-detail.ok { color: var(--ok); border-color: rgba(0,255,136,0.3); background: rgba(0,255,136,0.05); }
    .match-detail.reg { color: var(--accent); border-color: rgba(0,212,255,0.3); background: rgba(0,212,255,0.05); }
    .match-detail.ng {
      color: var(--ng);
      border-color: var(--ng);
      background: rgba(255,59,92,0.1);
      font-size: 11px;
      font-weight: 700;
      padding: 11px 11px;
      border-width: 2px;
      letter-spacing: 0.01em;
    }
    .ng-token {
      display: inline-block;
      background: var(--ng);
      color: #1a0508;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 13px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      margin: 5px 4px 0 0;
      letter-spacing: 0.03em;
    }

    /* ─── Input card ─── */
    .input-card {
      background: var(--surface);
      border: 2px solid var(--border);
      border-radius: var(--card-r);
      padding: 11px;
      transition: border-color 0.2s;
      position: relative;
    }
    .input-card.active {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(0,212,255,0.2);
    }
    .card-label {
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 7px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 5px;
    }
    .card-label-left { display: flex; align-items: center; gap: 5px; }
    .card-label .dot {
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
    }

    .cam-btn {
      display: flex;
      align-items: center;
      gap: 3px;
      background: rgba(0,212,255,0.12);
      color: var(--accent);
      border: 1px solid rgba(0,212,255,0.3);
      border-radius: 5px;
      padding: 3px 7px;
      font-size: 7.5px;
      font-weight: 700;
      font-family: inherit;
      letter-spacing: 0.02em;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .cam-btn:active { background: rgba(0,212,255,0.22); transform: scale(0.96); }
    .cam-btn svg { width: 9px; height: 9px; flex-shrink: 0; }

    .scan-input {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: var(--text);
      font-size: 12px;
      font-family: 'Consolas', 'Courier New', 'Menlo', monospace;
      font-weight: 600;
      letter-spacing: 0.05em;
      caret-color: var(--accent);
    }
    .scan-input::placeholder {
      color: var(--muted);
      font-weight: 400;
      font-size: 9px;
      letter-spacing: 0;
    }

    .scan-hint {
      margin-top: 5px;
      font-size: 8px;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .scan-hint .pulse {
      width: 4px; height: 4px;
      border-radius: 50%;
      background: var(--accent);
      animation: blink 1.2s ease-in-out infinite;
      flex-shrink: 0;
    }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

    /* ─── Target list ─── */
    .section-label {
      font-size: 7.5px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 2px;
    }
    .section-label .count { color: var(--accent); font-size: 9px; }
    .target-list { display: flex; flex-direction: column; gap: 5px; }
    .target-empty {
      font-size: 9px;
      color: var(--muted);
      text-align: center;
      padding: 12px 8px;
      border: 1px dashed var(--border);
      border-radius: 8px;
      line-height: 1.6;
    }
    .target-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 7px 9px;
      transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
    }
    .target-row.hit {
      border-color: var(--ok);
      background: rgba(0,255,136,0.12);
      box-shadow: 0 0 14px rgba(0,255,136,0.25);
    }
    .target-info { min-width: 0; flex: 1; }
    .target-key {
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 12px;
      font-weight: 700;
      color: var(--text);
      word-break: break-all;
      line-height: 1.3;
    }
    .target-idx { color: var(--muted); margin-right: 4px; font-weight: 600; }
    .target-raw {
      font-size: 7.5px;
      color: var(--muted);
      word-break: break-all;
      margin-top: 2px;
      line-height: 1.4;
    }
    .target-del {
      flex-shrink: 0;
      width: 24px; height: 24px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--ng);
      font-size: 13px;
      font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .target-del:active { background: rgba(255,59,92,0.15); transform: scale(0.94); }

    /* ─── Footer controls ─── */
    .footer {
      padding: 8px 11px calc(8px + env(safe-area-inset-bottom, 0px));
      flex-shrink: 0;
      border-top: 1px solid var(--border);
      background: var(--surface);
    }
    .reset-btn {
      width: 100%;
      background: var(--border);
      color: var(--text);
      border: 1.5px solid #2a2a40;
      border-radius: 8px;
      padding: 9px;
      font-size: 10px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s;
      letter-spacing: 0.03em;
      -webkit-tap-highlight-color: transparent;
    }
    .reset-btn:active { background: #2a2a40; transform: scale(0.98); }

    /* ─── Feedback flash overlay ─── */
    .flash {
      pointer-events: none;
      position: fixed;
      inset: 0;
      opacity: 0;
      z-index: 100;
      transition: opacity 0.05s;
    }
    .flash.ok  { background: rgba(0,255,136,0.22); }
    .flash.ng  { background: rgba(255,59,92,0.28); }
    .flash.reg { background: rgba(0,212,255,0.18); }
    .flash.show { opacity: 1; }

    /* ─── Camera scan modal ─── */
    .cam-modal {
      position: fixed;
      inset: 0;
      background: #000;
      z-index: 200;
      display: none;
      flex-direction: column;
    }
    .cam-modal.open { display: flex; }
    .cam-video-wrap { position: relative; flex: 1; overflow: hidden; background: #000; }
    .cam-video-wrap video { width: 100%; height: 100%; object-fit: cover; }
    .cam-frame {
      position: absolute;
      top: 50%; left: 50%;
      width: 72%; max-width: 320px;
      aspect-ratio: 1;
      transform: translate(-50%, -50%);
      border: 3px solid var(--accent);
      border-radius: 18px;
      box-shadow: 0 0 0 2000px rgba(0,0,0,0.45);
    }
    .cam-frame::before, .cam-frame::after {
      content: '';
      position: absolute;
      left: 0; right: 0;
      height: 2px;
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
      animation: cam-scan 1.8s ease-in-out infinite;
    }
    @keyframes cam-scan { 0%,100% { top: 6%; } 50% { top: 92%; } }
    .cam-topbar {
      position: absolute;
      top: env(safe-area-inset-top, 0px);
      left: 0; right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      z-index: 1;
    }
    .cam-topbar .cam-label {
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      background: rgba(0,0,0,0.5);
      padding: 4px 9px;
      border-radius: 20px;
      letter-spacing: 0.02em;
    }
    .cam-close {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(0,0,0,0.5);
      border: none;
      color: #fff;
      font-size: 20px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .cam-status {
      position: absolute;
      bottom: calc(28px + env(safe-area-inset-bottom, 0px));
      left: 0; right: 0;
      text-align: center;
      color: #fff;
      font-size: 9px;
      font-weight: 600;
      padding: 0 24px;
    }
    .cam-error {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 9px;
      padding: 21px;
      text-align: center;
    }
    .cam-error p { color: var(--muted); font-size: 9px; line-height: 1.6; }
    .cam-error-icon { font-size: 27px; }
    .cam-retry-btn {
      background: var(--accent);
      color: #04303d;
      border: none;
      padding: 7px 15px;
      border-radius: 7px;
      font-size: 9px;
      font-weight: 700;
      cursor: pointer;
    }
    .cam-debug-log {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      max-height: 40vh;
      overflow-y: auto;
      background: rgba(0,0,0,0.85);
      color: #7fffaa;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 7.5px;
      line-height: 1.5;
      padding: 5px 7px;
      z-index: 5;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .cam-debug-log .err { color: #ff6b6b; }
    .cam-debug-log .ok  { color: #7fffaa; }
    .cam-debug-log .info { color: #ffd166; }

    .status-bar {
      font-size: 7.5px;
      color: var(--muted);
      text-align: center;
      padding-bottom: 4px;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>

<div class="flash" id="flash"></div>

<div class="app">
  <!-- Header -->
  <header class="header">
    <div class="header-title">
      <div class="header-icon">🔍</div>
      <h1>Barcode-Finder</h1>
      <span class="build-tag" id="buildTag">build&nbsp;2&nbsp;PWA</span>
    </div>
    <div class="step-badge" id="stateBadge">登録</div>
  </header>

  <!-- Pinned hero: キーボードが出ても常に見える最上部 -->
  <div class="hero-fixed">
    <div class="result-panel reg" id="resultPanel">
      <div>
        <div class="result-label" id="resultLabel">登録件数</div>
        <div class="result-value" id="resultValue">0 / 10</div>
      </div>
      <div class="result-icon-wrap" id="resultIcon">📝</div>
    </div>
    <div class="match-detail" id="matchDetail"></div>
  </div>

  <!-- Main -->
  <main class="main">

    <!-- 判定モード -->
    <div class="mode-toggle" id="modeToggle">
      <button class="mode-btn active" id="modeBtnPart" onclick="setMode('part')" type="button">
        品番抽出照合
        <span class="mode-btn-sub">4番目の項目で判定</span>
      </button>
      <button class="mode-btn" id="modeBtnFull" onclick="setMode('full')" type="button">
        全体照合
        <span class="mode-btn-sub">バーコード全体で判定</span>
      </button>
    </div>

    <!-- 動作モード（登録／照合） -->
    <div class="mode-toggle state-toggle" id="stateToggle">
      <button class="mode-btn active" id="stateBtnReg" onclick="setOpMode('register')" type="button">
        ① 登録モード
        <span class="mode-btn-sub">最大10件を登録</span>
      </button>
      <button class="mode-btn" id="stateBtnSearch" onclick="setOpMode('search')" type="button">
        ② 照合モード
        <span class="mode-btn-sub">スキャンして検索</span>
      </button>
    </div>

    <!-- スキャン入力 -->
    <div class="input-card active" id="scanCard">
      <div class="card-label">
        <div class="card-label-left">
          <span class="dot"></span>
          <span id="scanCardLabel">① 登録するバーコード</span>
        </div>
        <button class="cam-btn" id="camBtn" onclick="openCamera()" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          カメラ
        </button>
      </div>
      <input class="scan-input" id="scanInput" type="text"
             placeholder="スキャンして登録（最大10件）" autocomplete="off"
             autocorrect="off" spellcheck="false">
      <div class="scan-hint"><span class="pulse"></span><span id="scanHint">スキャン待機中</span></div>
    </div>

    <!-- 登録リスト -->
    <div class="section-label">
      登録リスト
      <span class="count" id="targetCount">0 / 10</span>
    </div>
    <div class="target-list" id="targetList"></div>

    <div class="status-bar" id="statusBar">バーコードをスキャンして登録してください</div>

  </main>

  <!-- Footer -->
  <footer class="footer">
    <button class="reset-btn" id="resetBtn" onclick="resetAll()">↺ &nbsp;リセット（登録リストを全消去）</button>
  </footer>
</div>

<!-- Camera scan modal -->
<div class="cam-modal" id="camModal">
  <div class="cam-video-wrap">
    <video id="camVideo" playsinline muted autoplay></video>
    <div class="cam-topbar">
      <span class="cam-label" id="camLabel">バーコードをスキャン</span>
      <button class="cam-close" onclick="closeCamera()" aria-label="閉じる">✕</button>
    </div>
    <div class="cam-frame" id="camFrame"></div>
    <div class="cam-status" id="camStatus">QRコード・バーコードを枠内に収めてください</div>
  </div>
  <div class="cam-error" id="camError" style="display:none">
    <div class="cam-error-icon">📷</div>
    <p id="camErrorMsg">カメラを起動できませんでした。<br>ブラウザの設定でカメラへのアクセスを許可してください。</p>
    <button class="cam-retry-btn" onclick="retryCamera()">再試行</button>
  </div>
  <div class="cam-debug-log" id="camDebugLog"></div>
</div>

<script>
  // ─── Elements ───
  const scanInput   = document.getElementById('scanInput');
  const scanCard    = document.getElementById('scanCard');
  const scanCardLabel = document.getElementById('scanCardLabel');
  const scanHint    = document.getElementById('scanHint');
  const resultPanel = document.getElementById('resultPanel');
  const resultLabel = document.getElementById('resultLabel');
  const resultValue = document.getElementById('resultValue');
  const resultIcon  = document.getElementById('resultIcon');
  const matchDetail = document.getElementById('matchDetail');
  const flash       = document.getElementById('flash');
  const stateBadge  = document.getElementById('stateBadge');
  const statusBar   = document.getElementById('statusBar');
  const resetBtn    = document.getElementById('resetBtn');
  const modeToggle  = document.getElementById('modeToggle');
  const modeBtnPart = document.getElementById('modeBtnPart');
  const modeBtnFull = document.getElementById('modeBtnFull');
  const stateBtnReg = document.getElementById('stateBtnReg');
  const stateBtnSearch = document.getElementById('stateBtnSearch');
  const targetList  = document.getElementById('targetList');
  const targetCount = document.getElementById('targetCount');
  const camBtn      = document.getElementById('camBtn');
  const camModal    = document.getElementById('camModal');
  const camVideo    = document.getElementById('camVideo');
  const camLabel    = document.getElementById('camLabel');
  const camStatus   = document.getElementById('camStatus');
  const camError    = document.getElementById('camError');
  const camErrorMsg = document.getElementById('camErrorMsg');
  const camFrame    = document.getElementById('camFrame');
  const camDebugLog = document.getElementById('camDebugLog');

  function dbg(msg, type) {
    type = type || 'ok';
    console.log('[dbg]', msg);
    if (!camDebugLog) return;
    const line = document.createElement('div');
    line.className = type;
    const t = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    line.textContent = `[${t}] ${msg}`;
    camDebugLog.appendChild(line);
    camDebugLog.scrollTop = camDebugLog.scrollHeight;
    while (camDebugLog.childNodes.length > 60) camDebugLog.removeChild(camDebugLog.firstChild);
  }

  // ─── State ───
  const MAX_TARGETS = 10;
  let targets = [];                 // 登録された生のバーコード文字列
  let opMode = 'register';          // 'register' | 'search'
  let compareMode = 'part';         // 'part' | 'full'
  let scanBuffer = '';
  let bufTimer = null;
  let autoTimer = null;
  let lastScan = { v: '', t: 0 };
  const BUF_MS  = 800;
  const AUTO_MS = 500;

  // ─── Audio ───
  let ctx = null;
  function ensureAudio() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){} }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }
  function tone(freq, dur, type='sine', vol=0.5) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }
  function soundOK()   { tone(523,0.12,'sine',0.5); setTimeout(()=>tone(784,0.16,'sine',0.5),120); }
  function soundBeep() { tone(880,0.08,'sine',0.4); }
  function soundNG()   {
    tone(160,0.28,'sawtooth',0.8);
    setTimeout(()=>tone(140,0.28,'sawtooth',0.8),320);
    setTimeout(()=>tone(120,0.28,'sawtooth',0.8),640);
  }

  function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }
  function doFlash(type) {
    flash.className = `flash ${type} show`;
    setTimeout(() => flash.classList.remove('show'), 120);
  }
  function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // ─── フィールド抽出（カンマ区切りの4番目＝品番） ───
  const TARGET_FIELD_INDEX = 3;
  function extractField(s) {
    const raw = (s || '').trim();
    const fields = raw.split(',').map(f => f.trim());
    if (fields.length > TARGET_FIELD_INDEX && fields[TARGET_FIELD_INDEX]) return fields[TARGET_FIELD_INDEX];
    return raw; // フィールド不足時は全体を返す
  }

  // 判定キー：partモードは品番、fullモードは全体
  function keyOf(raw) {
    const v = (raw || '').trim();
    return compareMode === 'part' ? extractField(v) : v;
  }

  // ─── 表示ヘルパ ───
  function setResult(type, text, icon, label) {
    resultPanel.className = `result-panel ${type}`;
    resultValue.textContent = text;
    resultIcon.textContent  = icon;
    if (label) resultLabel.textContent = label;
  }

  function renderTargets() {
    targetCount.textContent = `${targets.length} / ${MAX_TARGETS}`;
    if (targets.length === 0) {
      targetList.innerHTML =
        `<div class="target-empty">まだ登録がありません。<br>「登録モード」でバーコードをスキャンすると、ここに最大${MAX_TARGETS}件まで追加されます。</div>`;
      return;
    }
    targetList.innerHTML = targets.map((raw, i) => {
      const k = keyOf(raw);
      const rawTrim = raw.trim();
      const showRaw = (k !== rawTrim);
      return `<div class="target-row" data-row="${i}">
        <div class="target-info">
          <div class="target-key"><span class="target-idx">${i+1}.</span>${escapeHtml(k)}</div>
          ${showRaw ? `<div class="target-raw">元データ: ${escapeHtml(rawTrim)}</div>` : ``}
        </div>
        <button class="target-del" data-del="${i}" type="button" aria-label="削除">✕</button>
      </div>`;
    }).join('');
  }

  // 削除（イベント委譲）
  targetList.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-del]');
    if (!btn) return;
    const i = parseInt(btn.dataset.del, 10);
    if (isNaN(i)) return;
    targets.splice(i, 1);
    renderTargets();
    vibrate(15);
    if (opMode === 'register') {
      setResult('reg', `${targets.length} / ${MAX_TARGETS}`, '📝', '登録件数');
      statusBar.textContent = `削除しました（${targets.length}/${MAX_TARGETS}）`;
    }
    scanInput.focus();
  });

  // ─── モード切替 ───
  function setMode(mode) {
    if (opMode === 'search') { statusBar.textContent = '判定モードは登録モードのときに変更できます'; return; }
    compareMode = mode;
    modeBtnPart.classList.toggle('active', mode === 'part');
    modeBtnFull.classList.toggle('active', mode === 'full');
    renderTargets();
    setResult('reg', `${targets.length} / ${MAX_TARGETS}`, '📝', '登録件数');
    statusBar.textContent = mode === 'part'
      ? '品番抽出照合モード（4番目の項目で判定）'
      : '全体照合モード（バーコード全体で判定）';
    scanInput.focus();
  }

  function setOpMode(m) {
    if (m === 'search' && targets.length === 0) {
      statusBar.textContent = '先にバーコードを登録してください';
      stateBtnReg.classList.add('active');
      stateBtnSearch.classList.remove('active');
      soundNG(); vibrate(60);
      return;
    }
    opMode = m;
    stateBtnReg.classList.toggle('active', m === 'register');
    stateBtnSearch.classList.toggle('active', m === 'search');
    modeToggle.classList.toggle('locked', m === 'search'); // 照合中は判定モード固定
    stateBadge.textContent = m === 'register' ? '登録' : '照合';
    matchDetail.style.display = 'none';
    matchDetail.className = 'match-detail';

    if (m === 'register') {
      scanCardLabel.textContent = '① 登録するバーコード';
      scanInput.placeholder = `スキャンして登録（最大${MAX_TARGETS}件）`;
      scanHint.textContent = 'スキャンで登録リストに追加';
      setResult('reg', `${targets.length} / ${MAX_TARGETS}`, '📝', '登録件数');
      statusBar.textContent = 'バーコードをスキャンして登録してください';
    } else {
      scanCardLabel.textContent = '② 照合するバーコード';
      scanInput.placeholder = 'スキャンして検索';
      scanHint.textContent = 'スキャンで登録リストと照合';
      setResult('', '待機中', '⏳', '照合結果');
      statusBar.textContent = compareMode === 'part'
        ? 'スキャンして検索（品番抽出照合）'
        : 'スキャンして検索（全体照合）';
    }
    scanInput.value = '';
    scanInput.focus();
  }

  // ─── 登録 ───
  function addTarget(raw) {
    const v = (raw || '').trim();
    if (!v) return;

    if (targets.length >= MAX_TARGETS) {
      matchDetail.className = 'match-detail ng';
      matchDetail.style.display = 'block';
      matchDetail.innerHTML = `⚠ 登録は最大${MAX_TARGETS}件です。不要な項目を削除してください`;
      statusBar.textContent = '登録上限に達しています';
      soundNG(); vibrate([80,50,80]); doFlash('ng');
      return;
    }
    const k = keyOf(v);
    if (targets.some(t => keyOf(t) === k)) {
      matchDetail.className = 'match-detail';
      matchDetail.style.display = 'block';
      matchDetail.innerHTML = `⚠ 既に登録済み：<b>${escapeHtml(k)}</b>`;
      statusBar.textContent = '既に登録済みです';
      soundBeep(); vibrate(20);
      return;
    }
    targets.push(v);
    renderTargets();
    setResult('reg', `${targets.length} / ${MAX_TARGETS}`, '📝', '登録件数');
    matchDetail.className = 'match-detail reg';
    matchDetail.style.display = 'block';
    matchDetail.innerHTML = `＋ 登録しました：<b>${escapeHtml(k)}</b>（残り ${MAX_TARGETS - targets.length} 件）`;
    statusBar.textContent = `登録しました（${targets.length}/${MAX_TARGETS}）`;
    soundBeep(); vibrate(30); doFlash('reg');
  }

  // ─── 照合（検索） ───
  function searchScan(raw) {
    const v = (raw || '').trim();
    if (!v) return;
    ensureAudio();
    const k = keyOf(v);
    const idx = targets.findIndex(t => keyOf(t) === k);

    if (idx >= 0) {
      setResult('ok', 'HIT', '✓', '照合結果');
      matchDetail.className = 'match-detail ok';
      matchDetail.style.display = 'block';
      matchDetail.innerHTML = `✓ 一致（登録 ${idx + 1} 番）<br><b>${escapeHtml(k)}</b>`;
      statusBar.textContent = 'HIT（一致）しました';
      soundOK(); doFlash('ok'); vibrate([60,40,60]);
      const row = targetList.querySelector(`[data-row="${idx}"]`);
      if (row) {
        row.classList.add('hit');
        row.scrollIntoView({ block: 'nearest' });
        setTimeout(() => row.classList.remove('hit'), 1600);
      }
    } else {
      setResult('ng', 'NO HIT', '✕', '照合結果');
      matchDetail.className = 'match-detail ng';
      matchDetail.style.display = 'block';
      matchDetail.innerHTML = `✗ 未登録のバーコードです<br><span class="ng-token">${escapeHtml(k)}</span>`;
      statusBar.textContent = 'NO HIT（未登録）です';
      soundNG(); doFlash('ng'); vibrate([80,50,80,50,80]);
    }
  }

  // ─── スキャン処理（登録／照合を振り分け） ───
  function processScan(raw) {
    const v = (raw || '').trim();
    if (!v) return;
    ensureAudio();
    const now = Date.now();
    if (v === lastScan.v && now - lastScan.t < 700) { scanInput.value = ''; return; } // 二重処理防止
    lastScan = { v, t: now };

    if (opMode === 'register') addTarget(v);
    else                       searchScan(v);

    scanInput.value = '';
    scanInput.focus();
  }

  // ─── 入力の受け取り（複数経路） ───
  // 1) BTスキャナー等の高速キー入力→Enter（画面全体で受信）
  document.addEventListener('keypress', function(e) {
    ensureAudio();
    if (e.key !== 'Enter') {
      scanBuffer += e.key;
      clearTimeout(bufTimer);
      bufTimer = setTimeout(() => { scanBuffer = ''; }, BUF_MS);
      return;
    }
    const val = (scanBuffer.trim() || scanInput.value.trim());
    scanBuffer = '';
    clearTimeout(bufTimer);
    if (!val) return;
    e.preventDefault();
    processScan(val);
  });

  // 2) 入力欄でEnter（IMEスキャナー等）
  scanInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); processScan(scanInput.value); }
  });

  // 3) Enterを送らないスキャナー向けフォールバック（入力停止後に確定）
  scanInput.addEventListener('input', () => {
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      const v = scanInput.value.trim();
      if (v) processScan(v);
    }, AUTO_MS);
  });

  // ─── リセット ───
  function resetAll() {
    ensureAudio();
    if (targets.length > 0 && !confirm(`登録リスト（${targets.length}件）を全て消去しますか？`)) return;
    vibrate(20);
    targets = [];
    lastScan = { v: '', t: 0 };
    scanBuffer = '';
    clearTimeout(bufTimer); clearTimeout(autoTimer);
    renderTargets();
    setOpMode('register');
    matchDetail.style.display = 'none';
    statusBar.textContent = 'リセットしました。バーコードを登録してください';
    scanInput.focus();
  }

  // ─── Camera scanning ───
  let camStream = null;
  let camRafId = null;
  let camCanvas = null;
  let camCtx = null;
  let nativeDetector = null;
  let camStopScan = null;

  if ('BarcodeDetector' in window) {
    try {
      nativeDetector = new BarcodeDetector({
        formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf', 'codabar']
      });
    } catch (e) { nativeDetector = null; }
  }

  async function openCamera() {
    camDebugLog.innerHTML = '';
    dbg(`カメラ起動開始 opMode=${opMode}`, 'info');
    dbg(`BarcodeDetector対応: ${'BarcodeDetector' in window}`, 'info');
    dbg(`jsQR読み込み済み: ${typeof window.jsQR === 'function'}`, 'info');
    camLabel.textContent = opMode === 'register' ? '登録するバーコードをスキャン' : '照合するバーコードをスキャン';
    camError.style.display = 'none';
    camFrame.style.display = '';
    camStatus.style.display = '';
    camModal.classList.add('open');
    ensureAudio();

    try {
      camStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      dbg('カメラストリーム取得成功', 'ok');
      camVideo.srcObject = camStream;
      await camVideo.play();
      dbg(`video再生開始 ${camVideo.videoWidth}x${camVideo.videoHeight}`, 'ok');
      startScanLoop();
    } catch (err) {
      dbg(`getUserMediaエラー: ${err && err.name}: ${err && err.message}`, 'err');
      showCamError(err);
    }
  }

  function showCamError(err) {
    camFrame.style.display = 'none';
    camStatus.style.display = 'none';
    camError.style.display = 'flex';
    if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
      camErrorMsg.innerHTML = 'カメラへのアクセスが許可されていません。<br>ブラウザの設定でこのサイトのカメラ権限を許可してください。';
    } else if (err && err.name === 'NotFoundError') {
      camErrorMsg.innerHTML = 'カメラが見つかりませんでした。<br>端末にカメラが接続されているかご確認ください。';
    } else {
      camErrorMsg.innerHTML = 'カメラを起動できませんでした。<br>ページを再読み込みして再度お試しください。';
    }
  }

  function retryCamera() { openCamera(); }

  function closeCamera() {
    camModal.classList.remove('open');
    if (camStopScan) { camStopScan(); camStopScan = null; }
    if (camRafId) { cancelAnimationFrame(camRafId); camRafId = null; }
    if (camStream) { camStream.getTracks().forEach(t => t.stop()); camStream = null; }
    camVideo.srcObject = null;
    scanInput.focus();
  }

  function startScanLoop() {
    if (!camCanvas) {
      camCanvas = document.createElement('canvas');
      camCtx = camCanvas.getContext('2d', { willReadFrequently: true });
    }
    let busy = false, stopped = false, frameCount = 0;
    camStopScan = () => { stopped = true; dbg('スキャンループ停止', 'info'); };
    dbg('スキャンループ開始', 'info');

    const scanFrame = async () => {
      if (stopped) return;
      if (busy || !camStream || camVideo.readyState < 2) { camRafId = requestAnimationFrame(scanFrame); return; }
      busy = true; frameCount++;

      let value = null;
      if (nativeDetector) {
        try {
          const codes = await nativeDetector.detect(camVideo);
          if (codes && codes.length) { value = codes[0].rawValue; dbg(`BarcodeDetector検出: "${value}"`, 'ok'); }
        } catch (e) { dbg(`BarcodeDetector例外: ${e && e.message}`, 'err'); }
      } else if (window.jsQR) {
        const w = camVideo.videoWidth, h = camVideo.videoHeight;
        if (w && h) {
          camCanvas.width = w; camCanvas.height = h;
          camCtx.drawImage(camVideo, 0, 0, w, h);
          const imgData = camCtx.getImageData(0, 0, w, h);
          const result = jsQR(imgData.data, w, h);
          if (result && result.data) { value = result.data; dbg(`jsQR検出: "${value}"`, 'ok'); }
        }
      }

      busy = false;
      if (stopped) return;
      if (value) { onCameraResult(value.trim()); return; }
      camRafId = requestAnimationFrame(scanFrame);
    };
    camRafId = requestAnimationFrame(scanFrame);
  }

  function onCameraResult(value) {
    if (!value) { camRafId = requestAnimationFrame(() => startScanLoop()); return; }
    vibrate(40);
    if (camStopScan) { camStopScan(); camStopScan = null; }
    if (camRafId) { cancelAnimationFrame(camRafId); camRafId = null; }
    dbg(`検出値を処理: "${value}"`, 'ok');
    try { processScan(value); } catch (e) { dbg(`処理中に例外: ${e && e.message}`, 'err'); }
    // 登録モードは続けて次を読めるよう1.2秒後に閉じる／照合モードも同様
    setTimeout(() => { closeCamera(); }, 1200);
  }

  camModal.addEventListener('click', e => { if (e.target === camModal) closeCamera(); });

  // ─── Native Android wrapper bridge ───
  // KEYENCE DX-A800等、物理トリガーで読み取った値はネイティブのラッパー経由でここへ。
  window.onNativeScan = function(value) {
    const v = String(value || '').trim();
    if (!v) return;
    console.log('[native] onNativeScan value=', v, 'opMode=', opMode);
    vibrate(40);
    processScan(v);
  };

  // ─── ソフトキーボード対応（可視領域に合わせる） ───
  const appEl = document.querySelector('.app');
  function fitToViewport() {
    const vv = window.visualViewport;
    if (!vv || !appEl) return;
    appEl.style.height = vv.height + 'px';
    appEl.style.top    = vv.offsetTop + 'px';
    appEl.style.left   = vv.offsetLeft + 'px';
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', fitToViewport);
    window.visualViewport.addEventListener('scroll', fitToViewport);
  }
  window.addEventListener('load', fitToViewport);
  window.addEventListener('resize', fitToViewport);
  window.addEventListener('orientationchange', () => setTimeout(fitToViewport, 300));

  // Ensure audio on first touch
  document.addEventListener('touchstart', ensureAudio, { once: true });
  document.addEventListener('click',      ensureAudio, { once: true });

  // ─── Service Worker（オフライン対応＋常に最新へ更新） ───
  if ('serviceWorker' in navigator) {
    let reloadedForUpdate = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloadedForUpdate) return;
      reloadedForUpdate = true;
      window.location.reload(); // 新しいSWが制御を握ったら一度だけ再読み込み
    });
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        reg.update();
        if (reg.waiting) reg.waiting.postMessage('skipWaiting');
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && reg.waiting) reg.waiting.postMessage('skipWaiting');
          });
        });
      }).catch(() => {});
    });
  }

  // ─── 初期化 ───
  renderTargets();
  window.addEventListener('load', () => { scanInput.focus(); });
</script>
</body>
</html>
