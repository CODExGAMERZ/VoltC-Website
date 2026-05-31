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
        persistSession: true // Keeps session token stored in localStorage to stay logged in across page reloads.
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
  loadProfileFromLocalStorage();
  loadFile(currentState.activeFile);
  updateVersionUI();
  updateDockUI();
  
  // Set up Supabase Auth state change listener if client is active
  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        updateUserSessionUI(session.user.email);
        await syncProfileFromDatabase(session.user);
      } else {
        document.getElementById('navLoginBtn').style.display = 'inline-flex';
        document.getElementById('userProfileMenu').style.display = 'none';
        loadProfileFromLocalStorage();
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
    showToast("Source Control", "Please enter a commit message!", "warning");
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

// --- Custom Toast Notification Engine ---
function showToast(title, message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Select icon based on type
  let iconClass = 'fa-circle-info';
  if (type === 'success') iconClass = 'fa-circle-check';
  if (type === 'error') iconClass = 'fa-circle-xmark';
  if (type === 'warning') iconClass = 'fa-triangle-exclamation';

  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" aria-label="Close message">&times;</button>
    <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
  `;

  container.appendChild(toast);

  // Event listener to close manually
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    dismissToast(toast);
  });

  // Auto dismiss
  const autoDismissTimer = setTimeout(() => {
    dismissToast(toast);
  }, duration);

  function dismissToast(toastEl) {
    if (toastEl.classList.contains('removing')) return;
    toastEl.classList.add('removing');
    clearTimeout(autoDismissTimer);
    
    // Remove from DOM after slide-out animation finishes
    toastEl.addEventListener('animationend', (e) => {
      if (e.animationName === 'toast-fade-out') {
        toastEl.remove();
      }
    });
  }
}

// --- Custom Confirm Dialog Engine ---
let activeConfirmCallback = null;

function showConfirmDialog(title, message, onConfirm) {
  const overlay = document.getElementById('confirmDialogOverlay');
  const titleEl = document.getElementById('confirmDialogTitle');
  const messageEl = document.getElementById('confirmDialogMessage');
  const confirmBtn = document.getElementById('confirmDialogConfirmBtn');

  if (!overlay || !titleEl || !messageEl || !confirmBtn) return;

  titleEl.innerText = title;
  messageEl.innerText = message;
  activeConfirmCallback = onConfirm;

  // Setup confirm click handler
  confirmBtn.onclick = () => {
    closeConfirmDialog();
    if (activeConfirmCallback) {
      activeConfirmCallback();
      activeConfirmCallback = null;
    }
  };

  overlay.style.display = 'flex';
  overlay.offsetHeight; // force reflow
  overlay.classList.add('active');
}

function closeConfirmDialog() {
  const overlay = document.getElementById('confirmDialogOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
  setTimeout(() => {
    if (!overlay.classList.contains('active')) {
      overlay.style.display = 'none';
    }
  }, 250);
}

function closeConfirmDialogOutside(e) {
  if (e.target.id === 'confirmDialogOverlay') {
    closeConfirmDialog();
  }
}

// --- Password Visibility Toggle Helper ---
function togglePasswordVisibility(inputId, iconEl) {
  const input = document.getElementById(inputId);
  if (!input) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    iconEl.classList.remove('fa-eye');
    iconEl.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    iconEl.classList.remove('fa-eye-slash');
    iconEl.classList.add('fa-eye');
  }
}

// --- Inline Login Modal Errors & Success Helper ---
function clearAuthError() {
  const errorDiv = document.getElementById('authErrorMessage');
  if (errorDiv) {
    errorDiv.style.display = 'none';
    const errorText = errorDiv.querySelector('#authErrorText');
    if (errorText) errorText.innerText = '';
  }
}

function showAuthError(msg) {
  const errorDiv = document.getElementById('authErrorMessage');
  const errorText = document.getElementById('authErrorText');
  if (errorDiv && errorText) {
    errorText.innerText = msg;
    errorDiv.style.display = 'flex';
    // Trigger CSS shaking animation
    errorDiv.style.animation = 'none';
    errorDiv.offsetHeight; /* trigger reflow */
    errorDiv.style.animation = null;
  }
}

function showAuthSuccess(title, subtitle, callback) {
  const formContent = document.getElementById('authFormContent');
  const successScreen = document.getElementById('authSuccessScreen');
  const successTitle = document.getElementById('authSuccessTitle');
  const successSubtitle = document.getElementById('authSuccessSubtitle');
  
  if (formContent && successScreen) {
    successTitle.innerText = title;
    successSubtitle.innerText = subtitle;
    
    formContent.style.display = 'none';
    successScreen.style.display = 'flex';
    
    if (callback) callback();
    
    // Auto close modal after 1.5 seconds
    setTimeout(() => {
      closeLoginModal();
    }, 1500);
  }
}

// --- Login Modal Methods ---
function openLoginModal() {
  document.getElementById('loginModalOverlay').classList.add('active');
}

function closeLoginModal() {
  document.getElementById('loginModalOverlay').classList.remove('active');
  // Clear forms and reset back to form display after animation completes
  setTimeout(() => {
    clearAuthError();
    const formContent = document.getElementById('authFormContent');
    const successScreen = document.getElementById('authSuccessScreen');
    if (formContent && successScreen) {
      formContent.style.display = 'block';
      successScreen.style.display = 'none';
    }
    
    // Reset inputs
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerConfirmPassword').value = '';
    
    // Reset password field types to password
    document.getElementById('loginPassword').type = 'password';
    document.getElementById('registerPassword').type = 'password';
    document.getElementById('registerConfirmPassword').type = 'password';
    
    // Reset all toggle password icon classes
    document.querySelectorAll('.toggle-password').forEach(icon => {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    });
  }, 300);
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
  
  clearAuthError();
  
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
    
    showAuthSuccess("Welcome back!", `Logged in successfully as ${data.user.email}!`, () => {
      updateUserSessionUI(data.user.email);
      showToast("Success", `Logged in as ${data.user.email}`, "success");
    });
  } catch (error) {
    showAuthError(`Login Error: ${error.message}`);
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  
  clearAuthError();
  
  if (password !== confirmPassword) {
    showAuthError("Passwords do not match!");
    return;
  }
  
  if (password.length < 6) {
    showAuthError("Password must be at least 6 characters long!");
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
      showAuthSuccess("Check your email!", `Verification email sent to ${email}.`, () => {
        showToast("Verification Email", `Sent to ${email}`, "warning", 5000);
      });
    } else if (data.user) {
      showAuthSuccess("Welcome!", `Account created for ${data.user.email}!`, () => {
        updateUserSessionUI(data.user.email);
        showToast("Success", `Account registered and logged in as ${data.user.email}`, "success");
      });
    }
  } catch (error) {
    console.error("VoltC Auth Catch Error:", error);
    showAuthError(`Registration Error: ${error.message}`);
  }
}

async function mockOAuthLogin(provider) {
  if (!supabaseClient) {
    showAuthSuccess("OAuth Success", `Simulated authentication via ${provider}!`, () => {
      const mockEmail = `auth-${provider.toLowerCase()}@voltc-user.com`;
      updateUserSessionUI(mockEmail);
      showToast("OAuth Connected", `Logged in with ${provider} as ${mockEmail}`, "success");
    });
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
    showAuthError(`OAuth Login Error: ${error.message}`);
  }
}

function updateUserSessionUI(email) {
  document.getElementById('navLoginBtn').style.display = 'none';
  document.getElementById('userProfileMenu').style.display = 'block';
  document.getElementById('dropdownUserEmail').innerText = email;
}

function mockLoginSuccess(email) {
  showAuthSuccess("Success!", `Logged in successfully as ${email}.`, () => {
    updateUserSessionUI(email);
    showToast("Logged In", `Welcome back, ${email}!`, "success");
  });
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
  showConfirmDialog(
    "Confirm Logout", 
    "Are you sure you want to sign out of VoltC?", 
    async () => {
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
      showToast("Logged Out", "Signed out of session successfully.", "info");
    }
  );
}

// --- Newsletter Subscription ---
function subscribeNewsletter() {
  const emailInput = document.getElementById('newsletterEmail');
  const email = emailInput.value.trim();
  
  if (!email) {
    showToast("Newsletter Subscription", "Please enter a valid email address!", "error");
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

// --- Profile & Credentials State Management ---
let profileData = {
  displayName: 'VoltC Developer',
  bio: 'Full-stack Ubuntu developer...',
  gitToken: '',
  supabaseUrl: '',
  supabaseKey: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
};

function loadProfileFromLocalStorage() {
  const saved = localStorage.getItem('voltc_profile_data');
  if (saved) {
    try {
      profileData = { ...profileData, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Failed to parse stored profile data", e);
    }
  }
  applyProfileToUI();
}

function applyProfileToUI() {
  // Apply saved state to UI elements
  const avatarElements = [
    document.getElementById('userAvatar'),
    document.getElementById('profileModalAvatar')
  ];
  avatarElements.forEach(img => {
    if (img && profileData.avatar) {
      img.src = profileData.avatar;
    }
  });

  const displayNameEl = document.getElementById('profileModalDisplayName');
  if (displayNameEl && profileData.displayName) {
    displayNameEl.innerText = profileData.displayName;
  }
}

// Fetch Profile from Supabase Cloud
async function syncProfileFromDatabase(user) {
  if (!supabaseClient || !user) return;
  
  try {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (error && error.code !== 'PGRST116') { // PGRST116 is PostgreSQL code for "zero rows returned"
      throw error;
    }
    
    if (data) {
      profileData = {
        displayName: data.display_name || 'VoltC Developer',
        bio: data.bio || 'Full-stack Ubuntu developer...',
        gitToken: data.github_token || '',
        supabaseUrl: data.supabase_url || '',
        supabaseKey: data.supabase_key || '',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
      };
      
      applyProfileToUI();
    } else {
      // Create a default database profile record for new user
      await supabaseClient.from('profiles').insert({
        id: user.id,
        display_name: profileData.displayName,
        bio: profileData.bio,
        avatar: profileData.avatar
      });
    }
  } catch (err) {
    console.error("Supabase Profile Sync Warning:", err);
    showToast("Sync Offline", "Could not fetch profile from cloud database. Using local cache.", "warning");
  }
}

// Upsert Profile values helper
async function saveProfileField(updateObject) {
  // 1. Update active local memory state
  profileData = { ...profileData, ...updateObject };
  
  // 2. Fetch logged-in user if client is active
  let loggedInUser = null;
  if (supabaseClient) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      loggedInUser = user;
    } catch (e) {
      console.warn("Could not retrieve Supabase user session context:", e);
    }
  }
  
  // 3. Fallback to local storage if not authenticated
  if (!supabaseClient || !loggedInUser) {
    localStorage.setItem('voltc_profile_data', JSON.stringify(profileData));
    return true;
  }
  
  // 4. Save to Postgres Profiles table
  try {
    const dbUpdate = {};
    if (updateObject.displayName !== undefined) dbUpdate.display_name = updateObject.displayName;
    if (updateObject.bio !== undefined) dbUpdate.bio = updateObject.bio;
    if (updateObject.gitToken !== undefined) dbUpdate.github_token = updateObject.gitToken;
    if (updateObject.supabaseUrl !== undefined) dbUpdate.supabase_url = updateObject.supabaseUrl;
    if (updateObject.supabaseKey !== undefined) dbUpdate.supabase_key = updateObject.supabaseKey;
    if (updateObject.avatar !== undefined) dbUpdate.avatar = updateObject.avatar;

    const { error } = await supabaseClient
      .from('profiles')
      .upsert({ id: loggedInUser.id, ...dbUpdate });
      
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Supabase Profiles Cloud Save Error:", err);
    showToast("Cloud Save Failed", `Failed to sync database: ${err.message}`, "error");
    // fallback cache write
    localStorage.setItem('voltc_profile_data', JSON.stringify(profileData));
    return false;
  }
}

// Modal Toggle Handlers
function openProfileModal() {
  // Populate form fields with current state
  const displayNameInput = document.getElementById('profileDisplayName');
  const bioInput = document.getElementById('profileBio');
  const gitTokenInput = document.getElementById('profileGitToken');
  const supabaseUrlInput = document.getElementById('profileSupabaseUrl');
  const supabaseKeyInput = document.getElementById('profileSupabaseKey');

  if (displayNameInput) displayNameInput.value = profileData.displayName || '';
  if (bioInput) bioInput.value = profileData.bio || '';
  if (gitTokenInput) gitTokenInput.value = profileData.gitToken || '';
  if (supabaseUrlInput) supabaseUrlInput.value = profileData.supabaseUrl || '';
  if (supabaseKeyInput) supabaseKeyInput.value = profileData.supabaseKey || '';

  // Update header text based on active login session or defaults
  const emailEl = document.getElementById('profileModalEmail');
  const dropdownEmail = document.getElementById('dropdownUserEmail');
  if (emailEl && dropdownEmail) {
    emailEl.innerText = dropdownEmail.innerText || 'user@voltc.com';
  }

  const displayNameEl = document.getElementById('profileModalDisplayName');
  if (displayNameEl) {
    displayNameEl.innerText = profileData.displayName || 'Developer';
  }

  const avatarImg = document.getElementById('profileModalAvatar');
  if (avatarImg && profileData.avatar) {
    avatarImg.src = profileData.avatar;
  }

  // Display overlay
  document.getElementById('profileModalOverlay').classList.add('active');
}

function closeProfileModal() {
  document.getElementById('profileModalOverlay').classList.remove('active');
}

function closeProfileModalOutside(e) {
  if (e.target.id === 'profileModalOverlay') {
    closeProfileModal();
  }
}

// Profile Tab Switcher
function switchProfileTab(tab) {
  const isInfo = tab === 'info';
  
  const tabInfoBtn = document.getElementById('tabBtnProfileInfo');
  const tabCredsBtn = document.getElementById('tabBtnProfileCreds');
  const paneInfo = document.getElementById('paneProfileInfo');
  const paneCreds = document.getElementById('paneProfileCreds');

  if (tabInfoBtn && tabCredsBtn && paneInfo && paneCreds) {
    tabInfoBtn.classList.toggle('active', isInfo);
    tabCredsBtn.classList.toggle('active', !isInfo);
    paneInfo.style.display = isInfo ? 'block' : 'none';
    paneCreds.style.display = !isInfo ? 'block' : 'none';
  }
}

// Form Submission Handlers
async function handleProfileSave(e) {
  e.preventDefault();
  
  const displayName = document.getElementById('profileDisplayName').value.trim();
  const bio = document.getElementById('profileBio').value.trim();

  const success = await saveProfileField({ displayName, bio });
  if (success) {
    const displayNameEl = document.getElementById('profileModalDisplayName');
    if (displayNameEl) displayNameEl.innerText = displayName;
    showToast("Profile Updated", "Your bio and display details were saved successfully.", "success");
  }
}

async function handleCredentialsSave(e) {
  e.preventDefault();

  const gitToken = document.getElementById('profileGitToken').value.trim();
  const supabaseUrl = document.getElementById('profileSupabaseUrl').value.trim();
  const supabaseKey = document.getElementById('profileSupabaseKey').value.trim();

  const success = await saveProfileField({ gitToken, supabaseUrl, supabaseKey });
  if (success) {
    showToast("Credentials Secured", "API tokens and configuration keys updated.", "success");
  }
}

// Avatar File Uploading Logic
function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Ensure file is an image
  if (!file.type.startsWith('image/')) {
    showToast("Invalid File Type", "Please upload a valid image file.", "error");
    return;
  }

  // Check file size (cap at 2MB for localStorage)
  if (file.size > 2 * 1024 * 1024) {
    showToast("File Too Large", "Please select an image smaller than 2MB.", "warning");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Url = e.target.result;
    
    const success = await saveProfileField({ avatar: base64Url });
    if (success) {
      // Update avatar elements instantly
      const avatarEl = document.getElementById('userAvatar');
      const modalAvatarEl = document.getElementById('profileModalAvatar');
      if (avatarEl) avatarEl.src = base64Url;
      if (modalAvatarEl) modalAvatarEl.src = base64Url;

      showToast("Avatar Changed", "Your new profile picture was uploaded successfully.", "success");
    }
  };

  reader.readAsDataURL(file);
}

// Toggle Mobile Navigation Menu Drawer
function toggleMobileNav() {
  const hamburger = document.getElementById('navHamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
  }
}

// Close mobile nav when clicking on a link
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      const hamburger = document.getElementById('navHamburger');
      const navLinks = document.querySelector('.nav-links');
      if (hamburger && navLinks) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });
  });
});
