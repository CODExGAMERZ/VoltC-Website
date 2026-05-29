// --- Supabase Config & Initialization ---
// To connect to a live Supabase server, create a free project on https://supabase.com
// and paste your Project URL and Anon API key below.
const SUPABASE_URL = 'https://rgqygsyuvdpovnatgpns.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJncXlnc3l1dmRwb3ZuYXRncG5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDE3NjgsImV4cCI6MjA5NTU3Nzc2OH0.KB7H1h7Kz1qJfl0kx3X5_Js32apWazxXBUxAnc8HQcE';

const isSupabaseConfigured = 
  SUPABASE_URL !== 'https://your-supabase-project.supabase.co' && 
  SUPABASE_ANON_KEY !== 'your-anon-key-here';

let supabaseClient = null;
console.log("VoltC Auth: Initializing...");
if (isSupabaseConfigured) {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false // Keeps credentials out of localStorage (in-memory only). Set to true if you want users to stay logged in across page reloads.
      }
    });
    console.log("VoltC Auth: Supabase Client initialized successfully.");
  } else {
    console.error("VoltC Auth: Supabase SDK script failed to load from CDN. Check your network or browser console.");
  }
} else {
  console.log("VoltC Auth: Using local Mock Authentication (No Supabase keys configured).");
}

// --- VoltC IDE Simulator Configuration & State ---
let currentState = {
  version: 'v2', // 'v1' or 'v2'
  activeFile: 'hello.c',
  theme: 'midnight-crimson',
  beginnerMode: false,
  activeDrawer: 'files', // 'files', 'git', 'settings', or null
  activeDockTab: 'terminal', // 'terminal', 'build', 'memory', 'translator'
  isCompiled: false,
  hasError: false,
  gitFiles: [
    { name: 'buggy.c', status: 'M' },
    { name: 'Makefile', status: 'U' }
  ]
};

// --- Mock Code Templates ---
const codeTemplates = {
  'hello.c': `<span class="sim-c-include">#include</span> <span class="sim-c-string">&lt;stdio.h&gt;</span>

<span class="sim-c-type">int</span> main() {
    <span class="sim-c-keyword">printf</span>(<span class="sim-c-string">"Hello, VoltC v2! ⚡\\n"</span>);
    <span class="sim-c-keyword">return</span> <span class="sim-c-number">0</span>;
}`,

  'pointers.c': `<span class="sim-c-include">#include</span> <span class="sim-c-string">&lt;stdio.h&gt;</span>
<span class="sim-c-include">#include</span> <span class="sim-c-string">&lt;stdlib.h&gt;</span>

<span class="sim-c-type">int</span> main() {
    <span class="sim-c-type">int</span> x = <span class="sim-c-number">42</span>;
    <span class="sim-c-type">int</span> *ptr = &amp;x;
    
    <span class="sim-c-keyword">printf</span>(<span class="sim-c-string">"Value of x: %d\\n"</span>, x);
    <span class="sim-c-keyword">printf</span>(<span class="sim-c-string">"Value via ptr: %d\\n"</span>, *ptr);
    
    <span class="sim-c-comment">// Allocate block on the Heap</span>
    <span class="sim-c-type">int</span> *heap_val = <span class="sim-c-keyword">malloc</span>(<span class="sim-c-keyword">sizeof</span>(<span class="sim-c-type">int</span>));
    *heap_val = <span class="sim-c-number">100</span>;
    <span class="sim-c-keyword">printf</span>(<span class="sim-c-string">"Heap value: %d\\n"</span>, *heap_val);
    
    <span class="sim-c-keyword">free</span>(heap_val);
    <span class="sim-c-keyword">return</span> <span class="sim-c-number">0</span>;
}`,

  'buggy.c': `<span class="sim-c-include">#include</span> <span class="sim-c-string">&lt;stdio.h&gt;</span>

<span class="sim-c-type">int</span> main() {
    <span class="sim-c-type">int</span> count = <span class="sim-c-number">5</span>
    <span class="sim-c-keyword">printf</span>(<span class="sim-c-string">"Counting: %d\\n"</span>, count);
    
    <span class="sim-c-comment">// Warning: unused variable</span>
    <span class="sim-c-type">int</span> unused_var = <span class="sim-c-number">10</span>;
    
    <span class="sim-c-keyword">return</span> <span class="sim-c-number">0</span>;
}`
};

// Map file names to line counts for gutter drawing
const fileLineCounts = {
  'hello.c': 6,
  'pointers.c': 18,
  'buggy.c': 11
};

// --- Page Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  loadFile(currentState.activeFile);
  updateVersionUI();
  updateDockUI();
  
  // Set up Supabase Auth state change listener if client is active
  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session && session.user) {
        updateUserSessionUI(session.user.email);
      } else {
        document.getElementById('navLoginBtn').style.display = 'inline-flex';
        document.getElementById('userProfileMenu').style.display = 'none';
      }
    });
  }
});

// --- Core Simulator Actions ---

// 1. Load File content into Mock Editor
function loadFile(fileName) {
  currentState.activeFile = fileName;
  
  // Set tab active state in Explorer Tree
  document.querySelectorAll('.sim-tree-item').forEach(item => {
    item.classList.remove('active');
  });
  
  if (fileName === 'hello.c') document.getElementById('fileTabHello').classList.add('active');
  if (fileName === 'pointers.c') document.getElementById('fileTabPointers').classList.add('active');
  if (fileName === 'buggy.c') document.getElementById('fileTabBuggy').classList.add('active');
  
  // Update Header / Editor Tabs
  document.getElementById('simCurrentFileName').innerText = fileName;
  document.getElementById('activeEditorTabName').innerText = fileName;
  
  // Set Code Content
  const codeArea = document.getElementById('codeArea');
  codeArea.innerHTML = codeTemplates[fileName];
  
  // Re-generate line gutter
  renderGutter(fileLineCounts[fileName]);
  
  // Reset compiler highlights
  currentState.isCompiled = false;
  currentState.hasError = false;
  document.getElementById('linesGutter').querySelectorAll('div').forEach(div => {
    div.classList.remove('sim-gutter-marker-error');
  });
}

// 2. Render Editor Line Numbers
function renderGutter(lineCount) {
  const gutter = document.getElementById('linesGutter');
  gutter.innerHTML = '';
  for (let i = 1; i <= lineCount; i++) {
    const lineNum = document.createElement('div');
    lineNum.id = `gutter-line-${i}`;
    lineNum.innerText = i;
    gutter.appendChild(lineNum);
  }
}

// 3. Switch between VoltC v1 and v2 Mockups
function switchVersion(ver) {
  if (currentState.version === ver) return;
  currentState.version = ver;
  
  // Update toggle buttons active class
  document.getElementById('toggleV1').classList.toggle('active', ver === 'v1');
  document.getElementById('toggleV2').classList.toggle('active', ver === 'v2');
  
  // Apply visual changes for v1 limitations
  const simulator = document.getElementById('ideSimulator');
  const simHeading = document.getElementById('simulator-heading');
  
  if (ver === 'v1') {
    simHeading.innerHTML = 'Experience VoltC v1';
    document.getElementById('simStatusGCC').innerText = 'gcc 9.3.0';
    
    // Hide Git Sidebar
    document.getElementById('sidebarIconGit').style.display = 'none';
    
    // Collapse Drawer if open in Git mode
    if (currentState.activeDrawer === 'git') {
      closeDrawer();
    }
    
    // Force Theme back to Midnight Crimson (V1 supported theme)
    setTheme('midnight-crimson');
    
    // Hide settings theme selectors except Midnight Crimson
    document.getElementById('themeBtnVoid').style.display = 'none';
    document.getElementById('themeBtnSolar').style.display = 'none';
    document.getElementById('themeBtnArctic').style.display = 'none';
    document.getElementById('themeBtnHacker').style.display = 'none';
  } else {
    simHeading.innerHTML = 'Experience VoltC v2';
    document.getElementById('simStatusGCC').innerText = 'gcc 11.4.0';
    
    // Unhide Git Sidebar
    document.getElementById('sidebarIconGit').style.display = 'flex';
    
    // Unhide Theme selectors
    document.getElementById('themeBtnVoid').style.display = 'block';
    document.getElementById('themeBtnSolar').style.display = 'block';
    document.getElementById('themeBtnArctic').style.display = 'block';
    document.getElementById('themeBtnHacker').style.display = 'block';
  }
}

// Update settings, active widgets, drawer layouts based on VoltC Version
function updateVersionUI() {
  switchVersion(currentState.version);
}

// 4. Handle Theme selection inside Settings panel
function setTheme(themeName) {
  // If in v1 mode, block custom themes
  if (currentState.version === 'v1' && themeName !== 'midnight-crimson') {
    return;
  }
  
  currentState.theme = themeName;
  const sim = document.getElementById('ideSimulator');
  
  // Clear classes
  sim.classList.remove(
    'theme-midnight-crimson',
    'theme-void',
    'theme-solar',
    'theme-arctic',
    'theme-hacker'
  );
  
  // Add new theme class
  sim.classList.add(`theme-${themeName}`);
  
  // Update Buttons Active States
  document.getElementById('themeBtnMidnight').classList.toggle('active', themeName === 'midnight-crimson');
  document.getElementById('themeBtnVoid').classList.toggle('active', themeName === 'void');
  document.getElementById('themeBtnSolar').classList.toggle('active', themeName === 'solar');
  document.getElementById('themeBtnArctic').classList.toggle('active', themeName === 'arctic');
  document.getElementById('themeBtnHacker').classList.toggle('active', themeName === 'hacker');
}

// 5. Drawer Panel Toggles (File Explorer, Git, Settings)
function toggleDrawer(panel) {
  const drawer = document.getElementById('simDrawer');
  const filesIcon = document.getElementById('sidebarIconFiles');
  const gitIcon = document.getElementById('sidebarIconGit');
  const settingsIcon = document.getElementById('sidebarIconSettings');
  
  // Check if same panel was clicked -> collapse drawer
  if (currentState.activeDrawer === panel) {
    closeDrawer();
    return;
  }
  
  currentState.activeDrawer = panel;
  drawer.classList.remove('collapsed');
  
  // Update Active Sidebar Buttons
  filesIcon.classList.toggle('active', panel === 'files');
  gitIcon.classList.toggle('active', panel === 'git');
  settingsIcon.classList.toggle('active', panel === 'settings');
  
  // Display appropriate pane content
  document.getElementById('drawerFilesPane').style.display = panel === 'files' ? 'block' : 'none';
  document.getElementById('drawerGitPane').style.display = panel === 'git' ? 'block' : 'none';
  document.getElementById('drawerSettingsPane').style.display = panel === 'settings' ? 'block' : 'none';
  
  // Update Drawer Title
  const title = document.getElementById('drawerTitle');
  if (panel === 'files') title.innerText = 'WORKSPACE';
  if (panel === 'git') title.innerText = 'SOURCE CONTROL';
  if (panel === 'settings') title.innerText = 'SETTINGS';
}

function closeDrawer() {
  currentState.activeDrawer = null;
  document.getElementById('simDrawer').classList.add('collapsed');
  document.getElementById('sidebarIconFiles').classList.remove('active');
  document.getElementById('sidebarIconGit').classList.remove('active');
  document.getElementById('sidebarIconSettings').classList.remove('active');
}

// 6. Dock and Drawer Utilities

// 7. Bottom Dock Tabs Toggling
function switchDockTab(tab) {
  currentState.activeDockTab = tab;
  updateDockUI();
}

function updateDockUI() {
  const tabs = ['terminal', 'build', 'memory', 'translator'];
  tabs.forEach(t => {
    const button = document.getElementById(`dockTab${t.charAt(0).toUpperCase() + t.slice(1)}`);
    const pane = document.getElementById(`pane${t.charAt(0).toUpperCase() + t.slice(1)}`);
    
    if (button) button.classList.toggle('active', currentState.activeDockTab === t);
    if (pane) pane.style.display = currentState.activeDockTab === t ? 'block' : 'none';
  });
}

// 8. Beginner Mode Simplifications
function toggleBeginnerMode() {
  const checked = document.getElementById('beginnerModeToggle').checked;
  currentState.beginnerMode = checked;
  
  const gitBtn = document.getElementById('sidebarIconGit');
  const buildTab = document.getElementById('dockTabBuild');
  
  if (checked) {
    // Hide Advanced panels
    gitBtn.style.display = 'none';
    if (buildTab) buildTab.style.display = 'none';
    
    // Default tabs to Terminal
    if (currentState.activeDockTab === 'build') {
      switchDockTab('terminal');
    }
    
    closeDrawer();
  } else {
    // Restore based on version rules
    if (currentState.version === 'v2') {
      gitBtn.style.display = 'flex';
    }
    if (buildTab) buildTab.style.display = 'flex';
  }
}

/// 9. Build and execution simulations
function triggerBuildOnly() {
  currentState.isCompiled = true;
  switchDockTab('build');
  
  const buildOut = document.getElementById('buildOutput');
  const fileName = currentState.activeFile;
  const codeArea = document.getElementById('codeArea');
  const codeText = codeArea.innerText || codeArea.textContent;
  
  buildOut.innerHTML = `<span style="color:var(--sim-text-muted);">[1/1] Compiling ${fileName}...</span>\n`;
  
  // Clear any existing error highlights from the gutter
  document.getElementById('linesGutter').querySelectorAll('div').forEach(div => {
    div.classList.remove('sim-gutter-marker-error');
  });

  setTimeout(() => {
    // 1. Scan for missing semicolons (syntax errors) in C statements
    const lines = codeText.split(/\r?\n/);
    let missingSemicolonLine = -1;
    let missingSemicolonText = "";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      const isDeclaration = line.startsWith('int ') || line.startsWith('float ') || line.startsWith('double ') || line.startsWith('char ') || line.startsWith('long ');
      const isReturn = line.startsWith('return');
      const isPrintf = line.startsWith('printf');
      const isAssignment = line.includes('=') && !line.startsWith('for') && !line.startsWith('if') && !line.includes('==');
      
      const needsSemicolon = isDeclaration || isReturn || isPrintf || isAssignment;
      const hasSemicolon = line.endsWith(';') || line.includes(';');
      const hasBraces = line.endsWith('{') || line.endsWith('}');
      const isComment = line.startsWith('//') || line.startsWith('/*');
      const isPreprocessor = line.startsWith('#');
      
      if (needsSemicolon && !hasSemicolon && !hasBraces && !isComment && !isPreprocessor && line.length > 0) {
        missingSemicolonLine = i + 1;
        missingSemicolonText = lines[i];
        break;
      }
    }
    
    if (missingSemicolonLine !== -1) {
      currentState.hasError = true;
      buildOut.innerHTML += `<span style="color:var(--color-error); font-weight:bold;">error:</span> expected ';' before statement on <strong>${fileName}:${missingSemicolonLine}</strong>
    ${missingSemicolonText}
    ${' '.repeat(Math.max(0, missingSemicolonText.length - 1))}^
    ${' '.repeat(Math.max(0, missingSemicolonText.length - 1))};

<span style="color:var(--color-error); font-weight:bold;">VoltC Error Code VC-0492: Statement termination missing.</span>`;
      
      // Gutter highlighting
      const lineGutterElement = document.getElementById(`gutter-line-${missingSemicolonLine}`);
      if (lineGutterElement) {
        lineGutterElement.classList.add('sim-gutter-marker-error');
      }
      
      // Update Error Translator contents
      updateTranslatorPane(true, missingSemicolonLine);
    } else {
      currentState.hasError = false;
      buildOut.innerHTML += `<span style="color:var(--color-success); font-weight:bold;">Build Successful.</span> Binary generated: ./build/out`;
      updateTranslatorPane(false);
    }
  }, 400);
}

function triggerBuildAndRun() {
  triggerBuildOnly();
  
  setTimeout(() => {
    switchDockTab('terminal');
    const term = document.getElementById('terminalOutput');
    const fileName = currentState.activeFile;
    const codeArea = document.getElementById('codeArea');
    const codeText = codeArea.innerText || codeArea.textContent;
    
    if (currentState.hasError) {
      term.innerHTML = `<span style="color:var(--color-error);">[Compilation failed] Run aborted. Check build output.</span>`;
      loadMemoryModelFromCode(fileName, "", false);
      return;
    }
    
    term.innerHTML = `<span style="color:var(--sim-text-muted);">$ ./build/out</span>\n`;
    
    // Parse user's code for printfs
    const printfRegex = /printf\s*\(\s*"([^"]*)"\s*(?:,\s*([^)]*))?\)/g;
    let match;
    let outputs = [];
    
    while ((match = printfRegex.exec(codeText)) !== null) {
      let outputStr = match[1];
      const argsText = match[2];
      
      if (argsText) {
        const args = argsText.split(',').map(a => a.trim());
        args.forEach(arg => {
          // Check for variable in code
          const varRegex = new RegExp(`int\\s+${arg}\\s*=\\s*(-?\\d+);`);
          const varMatch = varRegex.exec(codeText);
          if (varMatch) {
            outputStr = outputStr.replace(/%d|%i/, varMatch[1]);
          }
          
          if (arg === '*ptr') {
            const xMatch = /int\s+x\s*=\s*(-?\\d+);/.exec(codeText);
            if (xMatch) {
              outputStr = outputStr.replace(/%d|%i/, xMatch[1]);
            }
          }
          
          if (arg === '*heap_val') {
            const hMatch = /\*heap_val\s*=\s*(-?\\d+);/.exec(codeText);
            if (hMatch) {
              outputStr = outputStr.replace(/%d|%i/, hMatch[1]);
            }
          }
        });
      }
      
      outputStr = outputStr.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      outputs.push(outputStr);
    }
    
    if (outputs.length > 0) {
      term.innerHTML += outputs.join('');
      term.innerHTML += `\n<span style="color:var(--color-success); font-weight:bold;">Process exited with code 0.</span>`;
    } else {
      term.innerHTML += `\n<span style="color:var(--color-success); font-weight:bold;">Process exited with code 0 (no stdout).</span>`;
    }
    
    loadMemoryModelFromCode(fileName, codeText, true);
  }, 900);
}

// 10. Memory Visualizer updates based on code parsing
function loadMemoryModelFromCode(fileName, codeText, active) {
  const stackBody = document.getElementById('memoryStackBody');
  const heapBody = document.getElementById('memoryHeapBody');
  
  if (!active) {
    stackBody.innerHTML = `<tr><td colspan="4" style="color:var(--sim-text-muted); text-align:center;">Stack empty. Build first.</td></tr>`;
    heapBody.innerHTML = `<tr><td colspan="3" style="color:var(--sim-text-muted); text-align:center;">Heap empty.</td></tr>`;
    return;
  }
  
  if (fileName === 'hello.c') {
    stackBody.innerHTML = `
      <tr><td>main()</td><td style="color:var(--sim-text-muted);">-</td><td style="color:var(--sim-text-muted);">-</td><td>0x7ffd50</td></tr>
    `;
    heapBody.innerHTML = `<tr><td colspan="3" style="color:var(--sim-text-muted); text-align:center;">No Heap allocations.</td></tr>`;
  } else {
    const intVarRegex = /int\s+(\w+)\s*=\s*(-?\d+);/g;
    const ptrVarRegex = /int\s*\*\s*(\w+)\s*=\s*&(\w+);/g;
    const heapPtrRegex = /int\s*\*\s*(\w+)\s*=\s*malloc/g;
    const heapValRegex = /\*(\w+)\s*=\s*(-?\d+);/g;
    
    let stackRows = "";
    let heapRows = "";
    let vars = {};
    let match;
    
    // Parse simple stack variables
    while ((match = intVarRegex.exec(codeText)) !== null) {
      vars[match[1]] = { type: 'int', val: match[2], addr: `0x7ffd${Math.floor(Math.random()*80 + 10)}` };
    }
    
    // Parse stack pointers
    while ((match = ptrVarRegex.exec(codeText)) !== null) {
      const ptrName = match[1];
      const targetName = match[2];
      const targetAddr = vars[targetName] ? vars[targetName].addr : 'unknown';
      vars[ptrName] = { type: 'int*', val: `${targetAddr} (→ ${targetName})`, addr: `0x7ffd${Math.floor(Math.random()*80 + 10)}`, isPtr: true };
    }
    
    // Parse heap pointers
    let heapPtrName = "";
    while ((match = heapPtrRegex.exec(codeText)) !== null) {
      heapPtrName = match[1];
      vars[heapPtrName] = { type: 'int*', val: `0x55d040 (Heap)`, addr: `0x7ffd${Math.floor(Math.random()*80 + 10)}`, isPtr: true };
    }
    
    // Parse heap values
    let heapVal = "100";
    while ((match = heapValRegex.exec(codeText)) !== null) {
      if (match[1] === heapPtrName) {
        heapVal = match[2];
      }
    }
    
    // Stack layout
    Object.keys(vars).forEach(varName => {
      const v = vars[varName];
      const isPtrClass = v.isPtr ? 'class="sim-vis-pointer"' : '';
      const valColor = v.isPtr ? 'style="color:var(--sim-accent);"' : '';
      stackRows += `<tr><td ${isPtrClass}>${varName}</td><td style="color:var(--sim-c-type)">${v.type}</td><td><span ${valColor}>${v.val}</span></td><td>${v.addr}</td></tr>`;
    });
    
    if (!stackRows) {
      stackRows = `<tr><td colspan="4" style="color:var(--sim-text-muted); text-align:center;">Stack empty.</td></tr>`;
    }
    stackBody.innerHTML = stackRows;
    
    // Heap layout
    if (heapPtrName && currentState.version === 'v2') {
      heapRows = `<tr><td><span style="color:var(--sim-accent);">0x55d040</span></td><td>4 bytes</td><td>${heapVal}</td></tr>`;
    } else if (heapPtrName && currentState.version === 'v1') {
      heapRows = `<tr><td colspan="3" style="color:var(--sim-text-muted); text-align:center;">[Upgrade to v2 for Heap Visualizer]</td></tr>`;
    } else {
      heapRows = `<tr><td colspan="3" style="color:var(--sim-text-muted); text-align:center;">No Heap allocations.</td></tr>`;
    }
    heapBody.innerHTML = heapRows;
  }
}

// 11. Error Translator panel updater
function updateTranslatorPane(hasError, lineNum = 4) {
  const content = document.getElementById('translatorContent');
  if (!hasError) {
    content.innerHTML = `<div style="color: var(--sim-text-muted);">No compiler errors. Translator idle.</div>`;
    return;
  }
  
  const fileName = currentState.activeFile;
  content.innerHTML = `
    <div class="sim-translator-box">
      <div class="sim-translator-error">
        <strong>${fileName}:${lineNum}: error:</strong> expected ';' before statement
      </div>
      <div class="sim-translator-plain">
        <i class="fa-solid fa-circle-question" style="color:var(--color-warning);"></i> 
        <strong>What this means:</strong> You are missing a statement terminator (semicolon <span>;</span>) on line ${lineNum}. 
        In C, every command instruction must end with a semicolon so the compiler knows it is finished.
      </div>
    </div>
  `;
}

// 13. Git commit actions
function commitChanges() {
  const input = document.getElementById('gitCommitMsg');
  const msg = input.value.trim();
  if (!msg) {
    alert("Please enter a commit message!");
    return;
  }
  
  // Empty git list
  const list = document.querySelector('.sim-git-file-list');
  list.innerHTML = `<div style="font-size:0.75rem; color:var(--sim-text-muted); padding:10px 0;">No unstaged changes. Workspace clean.</div>`;
  
  // Clear badge
  document.getElementById('sidebarIconGit').removeAttribute('data-badge');
  
  input.value = '';
  
  // Log in terminal
  switchDockTab('terminal');
  const term = document.getElementById('terminalOutput');
  term.innerHTML = `<span style="color:var(--sim-text-muted);">$ git commit -m "${msg}"</span>\n[main ${Math.random().toString(16).substr(2, 7)}] Commit: ${msg}\n 2 files changed, 12 insertions(+)\n\nvolt-shell: repository updated.`;
}


// --- Installer Tabs logic ---
function switchInstallTab(tabId) {
  // Update buttons
  const buttons = document.querySelectorAll('.install-tab-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.innerText.toLowerCase().includes(tabId));
  });
  
  // Show active panel
  const panels = document.querySelectorAll('.install-content-panel');
  panels.forEach(p => {
    p.classList.toggle('active', p.id.toLowerCase().includes(tabId));
  });
}

// Copy Code text helper
function copyTerminalCode() {
  // Find which panel is active to copy its code
  let codeText = '';
  if (document.getElementById('installPaneSnap').classList.contains('active')) {
    codeText = document.getElementById('snapCode').innerText;
  } else if (document.getElementById('installPaneDeb').classList.contains('active')) {
    codeText = document.getElementById('debCode').innerText.replace(/<br>/g, '\n');
  } else {
    codeText = document.getElementById('sourceCode').innerText.replace(/<br>/g, '\n');
  }
  
  navigator.clipboard.writeText(codeText).then(() => {
    const copyBtn = document.getElementById('copyCodeBtn');
    const origHtml = copyBtn.innerHTML;
    copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--color-success);"></i> Copied!';
    setTimeout(() => {
      copyBtn.innerHTML = origHtml;
    }, 2000);
  });
}

// --- Login Modal Methods ---
function openLoginModal() {
  document.getElementById('loginModalOverlay').classList.add('active');
}

function closeLoginModal() {
  document.getElementById('loginModalOverlay').classList.remove('active');
}

function closeLoginModalOutside(e) {
  if (e.target.id === 'loginModalOverlay') {
    closeLoginModal();
  }
}

function switchLoginTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tabBtnLogin').classList.toggle('active', isLogin);
  document.getElementById('tabBtnRegister').classList.toggle('active', !isLogin);
  
  document.getElementById('paneLogin').classList.toggle('active', isLogin);
  document.getElementById('paneRegister').classList.toggle('active', !isLogin);
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  
  if (!supabaseClient) {
    mockLoginSuccess(email);
    return;
  }
  
  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) throw error;
    
    closeLoginModal();
    updateUserSessionUI(data.user.email);
    alert(`⚡ Logged in successfully via Supabase as ${data.user.email}!`);
  } catch (error) {
    alert(`Login Error: ${error.message}`);
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }
  
  if (password.length < 6) {
    alert("Password must be at least 6 characters long!");
    return;
  }
  
  if (!supabaseClient) {
    console.log("VoltC Auth: Supabase not configured. Using Mock fallback.");
    mockLoginSuccess(email);
    return;
  }
  
  try {
    console.log(`VoltC Auth: Registering user ${email}...`);
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });
    
    if (error) {
      console.error("VoltC Auth Register Error:", error);
      throw error;
    }
    
    console.log("VoltC Auth Register Success Data:", data);
    
    if (data.user && data.session === null) {
      alert(`⚡ Verification email sent to ${email}! Please check your inbox.`);
      closeLoginModal();
    } else if (data.user) {
      closeLoginModal();
      updateUserSessionUI(data.user.email);
      alert(`⚡ Account created and logged in as ${data.user.email}!`);
    }
  } catch (error) {
    console.error("VoltC Auth Catch Error:", error);
    alert(`Registration Error: ${error.message}`);
  }
}

async function mockOAuthLogin(provider) {
  if (!supabaseClient) {
    mockLoginSuccess(`auth-${provider.toLowerCase()}@voltc-user.com`);
    return;
  }
  
  try {
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: provider.toLowerCase(),
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
  } catch (error) {
    alert(`OAuth Login Error: ${error.message}`);
  }
}

function updateUserSessionUI(email) {
  document.getElementById('navLoginBtn').style.display = 'none';
  document.getElementById('userProfileMenu').style.display = 'block';
  document.getElementById('dropdownUserEmail').innerText = email;
}

function mockLoginSuccess(email) {
  closeLoginModal();
  updateUserSessionUI(email);
  alert(`⚡ Logged in successfully (Mock Mode) as ${email}!`);
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  const isVisible = dropdown.style.display === 'block';
  dropdown.style.display = isVisible ? 'none' : 'block';
}

// Close dropdown on click outside
window.addEventListener('click', (e) => {
  if (!e.target.matches('#userAvatar')) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && dropdown.style.display === 'block') {
      dropdown.style.display = 'none';
    }
  }
});

async function logout() {
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (e) {
      console.error("Error signing out from Supabase: ", e);
    }
  }
  
  document.getElementById('navLoginBtn').style.display = 'inline-flex';
  document.getElementById('userProfileMenu').style.display = 'none';
  alert("Logged out successfully.");
}

// --- Newsletter Subscription ---
function subscribeNewsletter() {
  const emailInput = document.getElementById('newsletterEmail');
  const email = emailInput.value.trim();
  
  if (!email) {
    alert("Please enter a valid email address!");
    return;
  }
  
  // Show success message
  document.getElementById('subscribedEmailSpan').innerText = email;
  document.getElementById('subscribeSuccessMessage').style.display = 'block';
  
  // Clear input
  emailInput.value = '';
  
  // Hide after 6 seconds
  setTimeout(() => {
    document.getElementById('subscribeSuccessMessage').style.display = 'none';
  }, 6000);
}

// --- Suggestions and Feedback submission ---
function submitFeedbackForm(e) {
  e.preventDefault();
  
  const name = document.getElementById('feedbackName').value.trim();
  const email = document.getElementById('feedbackEmail').value.trim();
  const category = document.getElementById('feedbackCategory').value;
  const message = document.getElementById('feedbackMessage').value.trim();
  
  const submitBtn = document.getElementById('feedbackSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Sent';
  }
  
  // Show success message
  document.getElementById('feedbackSuccessMessage').style.display = 'block';
  
  // Reset form and button state after a short delay
  setTimeout(() => {
    document.getElementById('feedbackForm').reset();
    document.getElementById('feedbackSuccessMessage').style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send';
    }
  }, 4000);
}
