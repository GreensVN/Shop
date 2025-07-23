// Thêm vào phần đầu file
const NOTIFICATION_API_URL = "http://your-api-url:5000/api/notifications";

// Thêm hàm này vào phần hàm utility
async function fetchNotifications() {
    try {
        const response = await fetch(NOTIFICATION_API_URL);
        if (!response.ok) throw new Error("Failed to fetch notifications");
        const data = await response.json();
        return data.notifications.filter(n => n.is_active);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

// Thêm hàm hiển thị thông báo
function showGlobalNotification(notification) {
    const toast = document.createElement("div");
    toast.className = `toast show ${notification.type}`;
    toast.innerHTML = `
        <div class="toast-content">${notification.message}</div>
        <button class="toast-close"><i class="ri-close-line"></i></button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 10000);
    
    // Manual close
    toast.querySelector(".toast-close").addEventListener("click", () => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    });
}

// Thêm vào hàm init()
async function init() {
    // ... code hiện tại ...
    
    // Load and show notifications
    const notifications = await fetchNotifications();
    notifications.forEach(showGlobalNotification);
    
}

const TOGETHER_API_KEY = "tgp_v1_pT4x-hwfC1iKtBcbAAJd9g_340-jQlYULxc71aB68VQ";
const IMG_MODEL_ID = "black-forest-labs/FLUX.1-schnell-Free";

const GEMINI_API_KEY = "AIzaSyCEof-zQLnW9aet-eDqiV095IC9um3wpTQ";
const GEMINI_1_5_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;
const GEMINI_2_0_ENDPOINT = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" + GEMINI_API_KEY;

// DOM Elements
const chatlog = document.getElementById("chatlog");
const promptInput = document.getElementById("prompt");
const loader = document.getElementById("loader");
const imgPromptInput = document.getElementById("img_prompt");
const imggenLoader = document.getElementById("imggen_loader");
const sendBtn = document.getElementById("sendBtn");
const imggenBtn = document.getElementById("imggenBtn");
const newChatBtn = document.getElementById("newChatBtn");
const welcome = document.getElementById("welcome");
const sideChats = document.getElementById("sideChats");
const chatTitle = document.getElementById("chatTitle");
const toggleTheme = document.getElementById("toggleTheme");
const modelSelect = document.getElementById("modelSelect");
const snowCanvas = document.getElementById("snow");
const snowSwitch = document.getElementById("snowSwitch");
const micBtn = document.getElementById("micBtn");
const fileUpload = document.getElementById("fileUpload");
const fileInfo = document.getElementById("fileInfo");
const fileName = fileInfo.querySelector(".file-name");
const removeFile = fileInfo.querySelector(".remove-file");
const settingsBtn = document.getElementById("settingsBtn");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettings = document.getElementById("closeSettings");
const settingsOverlay = document.getElementById("settingsOverlay");
const toast = document.getElementById("toast");
const autoSpeech = document.getElementById("autoSpeech");
const speechRate = document.getElementById("speechRate");
const snowEffect = document.getElementById("snowEffect");
const darkMode = document.getElementById("darkMode");
const exportTxt = document.getElementById("exportTxt");
const exportMd = document.getElementById("exportMd");
const customApiKey = document.getElementById("customApiKey");

// State variables
let chats = [];
let chatIndex = 0;
let modelId = modelSelect.value;
let speechSynthesis = window.speechSynthesis;
let recognition = null;
let currentFile = null;
let lastMessageTime = {};
let rateLimit = false;
let snowEnabled = true;
let isMobile = window.matchMedia('(max-width: 900px)').matches;

// Enhance: Session backup/restore for safety
if (!localStorage.getItem("sessionBackup")) {
  window.addEventListener("beforeunload", () => {
    localStorage.setItem("sessionBackup", JSON.stringify({
      chats, chatIndex, modelId
    }));
  });
}

// --- PWA Install Prompt ---
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); });

// --- INIT ---
function init() {
  loadChats();
  renderSidebar();
  renderChat();
  chatTitle.textContent = chats[chatIndex].title || "ChatAI";
  promptInput.focus();

  // Accessibility: ARIA
  chatlog.setAttribute("aria-live","polite");

  // Speech recognition
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'vi-VN';
    recognition.onstart = () => micBtn.classList.add('recording');
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      promptInput.value = transcript;
      micBtn.classList.remove('recording');
    };
    recognition.onerror = (event) => {
      micBtn.classList.remove('recording');
      showToast('Lỗi nhận dạng giọng nói', 'error');
    };
    recognition.onend = () => micBtn.classList.remove('recording');
  } else {
    micBtn.style.display = 'none';
  }
  
  // Speech synthesis
  if (!speechSynthesis) {
    autoSpeech.disabled = true;
    showToast('Trình đọc văn bản không được hỗ trợ trên trình duyệt này', 'info');
  }

  // Load settings, set up snow
  loadSettings();
  setupSnow();
  setInterval(drawSnow, 33);

  // Keyboard shortcuts
  setupShortcuts();
  
  // Drag&Drop file upload
  chatlog.addEventListener('dragover', e => { e.preventDefault(); chatlog.classList.add('dragover'); });
  chatlog.addEventListener('dragleave', e => { e.preventDefault(); chatlog.classList.remove('dragover'); });
  chatlog.addEventListener('drop', handleDropFile);

  // Markdown paste (Ctrl+V)
  promptInput.addEventListener('paste', handlePaste);

  // Mobile: auto-scroll to input on focus
  if (isMobile) {
    promptInput.addEventListener('focus', () => setTimeout(()=>promptInput.scrollIntoView({block:'center'}), 200));
  }

  checkRateLimit();
}

// --- CHAT MANAGEMENT ---
function getCurrentHistory() {
  if (!chats[chatIndex]) chats[chatIndex] = {title:"Chat mới", history:[]};
  if (!Array.isArray(chats[chatIndex].history)) chats[chatIndex].history = [];
  return chats[chatIndex].history;
}
function saveChats() {
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("chatIndex", chatIndex);
  localStorage.setItem("modelId", modelId);
  localStorage.setItem("snow", snowSwitch.checked ? "on" : "off");
}
function loadChats() {
  const chs = localStorage.getItem("chats");
  const idx = localStorage.getItem("chatIndex");
  const mdl = localStorage.getItem("modelId");
  chats = [{title:"Chat mới", history:[]}];
  if (chs) {
    try {
      const arr = JSON.parse(chs);
      chats = Array.isArray(arr) ? arr.map(chat => ({
        title: chat.title || "Chat mới",
        history: Array.isArray(chat.history) ? chat.history : []
      })) : [{title:"Chat mới", history:[]}];
    } catch (e) {}
  }
  chatIndex = idx ? parseInt(idx) : 0;
  if (chatIndex < 0 || chatIndex >= chats.length) chatIndex = 0;
  if (mdl && modelSelect.querySelector(`[value="${mdl}"]`)) {
    modelSelect.value = mdl;
    modelId = mdl;
  }
}
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem("settings")) || {};
  autoSpeech.checked = settings.autoSpeech || false;
  speechRate.value = settings.speechRate || "1";
  snowEffect.checked = settings.snowEffect !== false;
  darkMode.checked = settings.darkMode || false;
  customApiKey.value = settings.customApiKey || "";
  if (darkMode.checked) document.body.classList.add('dark');
  snowSwitch.checked = snowEffect.checked;
  snowEnabled = snowEffect.checked;
}
function saveSettings() {
  const settings = {
    autoSpeech: autoSpeech.checked,
    speechRate: speechRate.value,
    snowEffect: snowEffect.checked,
    darkMode: darkMode.checked,
    customApiKey: customApiKey.value
  };
  localStorage.setItem("settings", JSON.stringify(settings));
}

// --- SIDEBAR ---
function renderSidebar() {
  sideChats.innerHTML = "";
  chats.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "side-chat-item" + (i === chatIndex ? " active" : "");

    const titleSpan = document.createElement("span");
    titleSpan.textContent = c.title || "Chat mới";
    div.appendChild(titleSpan);

    const pinBtn = document.createElement("span");
    pinBtn.className = "pin-chat";
    pinBtn.innerHTML = '<i class="ri-pushpin-2-line"></i>';
    pinBtn.title = "Ghim chat này";
    pinBtn.onclick = (e) => {
      e.stopPropagation();
      // Move to top
      const pinned = chats.splice(i, 1)[0];
      chats.unshift(pinned);
      chatIndex = 0;
      renderSidebar();
      renderChat();
      chatTitle.textContent = chats[chatIndex].title || "ChatAI";
      saveChats();
    };
    div.appendChild(pinBtn);

    const deleteBtn = document.createElement("span");
    deleteBtn.className = "delete-chat";
    deleteBtn.innerHTML = '<i class="ri-close-line"></i>';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if(confirm("Xóa đoạn chat này?")) {
        chats.splice(i,1);
        if(chatIndex>=chats.length) chatIndex=chats.length-1;
        if(chats.length===0) chats=[{title:"Chat mới",history:[]}];
        renderSidebar();
        renderChat();
        chatTitle.textContent = chats[chatIndex].title || "ChatAI";
        welcome.style.display = getCurrentHistory().length > 0 ? "none" : "";
        saveChats();
      }
    };
    div.appendChild(deleteBtn);

    div.onclick = () => {
      chatIndex = i;
      renderSidebar();
      renderChat();
      chatTitle.textContent = c.title || "ChatAI";
      welcome.style.display = getCurrentHistory().length > 0 ? "none" : "";
      saveChats();
    };

    sideChats.appendChild(div);
  });
  // Add import/export all
  const importBtn = document.createElement("button");
  importBtn.textContent = "Nhập";
  importBtn.className = "export-btn";
  importBtn.onclick = importChats;
  const exportAllBtn = document.createElement("button");
  exportAllBtn.textContent = "Sao lưu";
  exportAllBtn.className = "export-btn";
  exportAllBtn.onclick = exportAllChats;
  sideChats.appendChild(importBtn);
  sideChats.appendChild(exportAllBtn);
}

// --- CHAT WINDOW ---
function renderChat() {
  chatlog.innerHTML = "";
  getCurrentHistory().forEach((msg, index) => {
    if(msg.role === "user") addBubble("user", msg.content, index);
    else if(msg.role === "assistant") addBubble("ai", msg.content, index);
    else if(msg.role === "image") addImgBubble(msg.url, msg.caption, index);
  });
  setTimeout(()=>chatlog.scrollTop = chatlog.scrollHeight, 100);
  welcome.style.display = getCurrentHistory().length > 0 ? "none" : "";

  // Highlight code blocks
  document.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block);
  });
}
function addBubble(role, content, index) {
  const div = document.createElement("div");
  div.className = "bubble " + role;
  div.setAttribute("tabindex", "0");
  // Parse markdown if it's an AI message
  const messageContent = role === "ai" ? marked.parse(content) : content.replace(/\n/g, '<br>');
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  div.innerHTML = `
    <div class="message-content">${messageContent}</div>
    <div class="message-meta">
      ${timestamp}
      <i class="ri-volume-up-line tts-btn" title="Đọc"></i>
      <i class="ri-file-copy-line copy-btn" title="Sao chép"></i>
      ${role === "user" ? '<i class="ri-edit-line edit-btn" title="Sửa"></i>' : ''}
    </div>
    <div class="message-actions">
      ${role === "user" ? '<button class="message-action edit-action"><i class="ri-edit-line"></i></button>' : ''}
      <button class="message-action copy-action"><i class="ri-file-copy-line"></i></button>
      <button class="message-action tts-action"><i class="ri-volume-up-line"></i></button>
      <button class="message-action share-action"><i class="ri-share-forward-line"></i></button>
    </div>
  `;
  if (typeof index !== 'undefined') div.setAttribute('data-index', index);
  chatlog.appendChild(div);

  // Actions
  const copyBtn = div.querySelector('.copy-btn, .copy-action');
  const ttsBtn = div.querySelector('.tts-btn, .tts-action');
  const editBtn = div.querySelector('.edit-btn, .edit-action');
  const shareBtn = div.querySelector('.share-action');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(stripHtml(content));
    showToast('Đã sao chép vào clipboard', 'success');
  });
  if (ttsBtn && speechSynthesis) ttsBtn.addEventListener('click', () => speak(content));
  if (editBtn && role === "user") editBtn.addEventListener('click', () => editMessage(index, content));
  if (shareBtn) shareBtn.addEventListener('click', () => shareMessage(content));
}
function addImgBubble(url, caption, index) {
  const div = document.createElement("div");
  div.className = "bubble img";
  div.setAttribute("tabindex", "0");
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  div.innerHTML = `
    <img src="${url}" alt="AI Image"/>
    <div class="caption">${caption||""}</div>
    <div class="message-meta">
      ${timestamp}
      <i class="ri-file-copy-line copy-btn" title="Sao chép mô tả"></i>
      <i class="ri-delete-bin-line delete-btn" title="Xóa ảnh"></i>
    </div>
    <div class="message-actions">
      <button class="message-action copy-action"><i class="ri-file-copy-line"></i></button>
      <button class="message-action delete-action"><i class="ri-delete-bin-line"></i></button>
      <button class="message-action share-action"><i class="ri-share-forward-line"></i></button>
    </div>
  `;
  if (typeof index !== 'undefined') div.setAttribute('data-index', index);
  chatlog.appendChild(div);

  const copyBtn = div.querySelector('.copy-btn, .copy-action');
  const deleteBtn = div.querySelector('.delete-btn, .delete-action');
  const shareBtn = div.querySelector('.share-action');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(caption);
    showToast('Đã sao chép mô tả vào clipboard', 'success');
  });
  if (deleteBtn) deleteBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn xóa ảnh này?')) {
      getCurrentHistory().splice(index, 1);
      renderChat();
      saveChats();
    }
  });
  if (shareBtn) shareBtn.addEventListener('click', () => shareMessage(caption + "\n" + url));
}
function editMessage(index, content) {
  const bubble = chatlog.querySelector(`.bubble[data-index="${index}"]`);
  if (!bubble) return;
  const editForm = document.createElement('div');
  editForm.className = 'bubble user edit-form';
  editForm.innerHTML = `
    <textarea class="edit-textarea">${content}</textarea>
    <div class="edit-buttons">
      <button class="edit-cancel">Hủy</button>
      <button class="edit-save">Lưu</button>
    </div>
  `;
  bubble.parentNode.insertBefore(editForm, bubble);
  bubble.style.display = 'none';
  const textarea = editForm.querySelector('.edit-textarea');
  textarea.focus();
  textarea.setSelectionRange(content.length, content.length);
  editForm.querySelector('.edit-cancel').addEventListener('click', () => {
    bubble.style.display = '';
    editForm.remove();
  });
  editForm.querySelector('.edit-save').addEventListener('click', () => {
    const newContent = textarea.value.trim();
    if (newContent && newContent !== content) {
      getCurrentHistory()[index].content = newContent;
      renderChat();
      saveChats();
    }
    bubble.style.display = '';
    editForm.remove();
  });
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      editForm.querySelector('.edit-save').click();
    } else if (e.key === 'Escape') {
      editForm.querySelector('.edit-cancel').click();
    }
  });
}

// --- SEND MESSAGE ---
function setLoader(show = true) { loader.style.display = show ? "block" : "none"; }
function checkRateLimit() {
  const now = Date.now();
  const lastMessage = lastMessageTime[modelId] || 0;
  const timeSinceLastMessage = now - lastMessage;
  if (timeSinceLastMessage < 2000) {
    rateLimit = true;
    const remainingTime = Math.ceil((2000 - timeSinceLastMessage) / 1000);
    showToast(`Vui lòng đợi ${remainingTime} giây trước khi gửi tin nhắn tiếp theo`, 'error');
    return true;
  }
  rateLimit = false;
  return false;
}
async function sendMessage() {
  if (rateLimit || checkRateLimit()) return;
  const msg = promptInput.value.trim();
  if (!msg) return;
  if(loader.style.display === "block") return;
  lastMessageTime[modelId] = Date.now();
  addBubble("user", msg);
  getCurrentHistory().push({ role: "user", content: msg });
  // Update chat title if it's the first message
  if (getCurrentHistory().length === 1) {
    const shortMsg = msg.length > 20 ? msg.substring(0, 20) + '...' : msg;
    chats[chatIndex].title = shortMsg;
    chatTitle.textContent = shortMsg;
  }
  promptInput.value = "";
  promptInput.disabled = true;
  setLoader(true);
  startThinkingAnimation();
  let ctxMsgs = getCurrentHistory().filter(m=>m.role==="user"||m.role==="assistant").slice(-10);
  // If there's a file, add it to the context
  if (currentFile) {
    try {
      const fileContent = await readFileContent(currentFile);
      ctxMsgs.unshift({
        role: "user",
        content: `Đây là nội dung tài liệu ${currentFile.name}:\n\n${fileContent}\n\nHãy trả lời câu hỏi của tôi dựa trên tài liệu này.`
      });
    } catch (e) { showToast("Lỗi đọc file", "error"); }
  }

  // Gemini model
  if (modelId === "gemini-1.5-flash" || modelId === "gemini-2.0-flash") {
    let endpoint = (modelId === "gemini-2.0-flash") ? GEMINI_2_0_ENDPOINT : GEMINI_1_5_ENDPOINT;
    let geminiMessages = ctxMsgs.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: geminiMessages })
      });
      const data = await res.json();
      setLoader(false);
      stopThinkingAnimation();
      promptInput.disabled = false;
      promptInput.focus();
      let reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Không có phản hồi!";
      addBubble("ai", reply);
      getCurrentHistory().push({ role: "assistant", content: reply });
      if (autoSpeech.checked && speechSynthesis) speak(reply);
      saveChats();
    } catch (e) {
      setLoader(false);
      stopThinkingAnimation();
      addBubble("ai", "❌ Lỗi kết nối Gemini!");
      promptInput.disabled = false;
      promptInput.focus();
      showToast("Lỗi Gemini", "error");
    }
  } else {
    // Together API
    const apiKey = customApiKey.value || TOGETHER_API_KEY;
    fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "system", content: "You are a helpful assistant." }, ...ctxMsgs],
      })
    })
    .then(res => res.json())
    .then(data => {
      setLoader(false);
      stopThinkingAnimation();
      promptInput.disabled = false;
      promptInput.focus();
      let reply = "";
      if (data.choices && data.choices.length && data.choices[0].message) {
        let fullReply = data.choices[0].message.content.trim();
        let lines = fullReply.split('\n').filter(x=>x.trim());
        reply = lines[lines.length-1];
        if (reply.length < 10) reply = lines.reverse().find(x=>x.length>10) || fullReply;
      } else if (data.error) {
        reply = `❌ Lỗi: ${data.error.message || "Không có phản hồi!"}`;
      } else {
        reply = "❌ Lỗi phản hồi!";
      }
      addBubble("ai", reply);
      getCurrentHistory().push({ role: "assistant", content: reply });
      if (autoSpeech.checked && speechSynthesis) speak(reply);
      saveChats();
    })
    .catch(e => {
      setLoader(false);
      stopThinkingAnimation();
      addBubble("ai", "❌ Lỗi kết nối!");
      promptInput.disabled = false;
      promptInput.focus();
      showToast("Lỗi mạng", "error");
    });
  }
}

// --- SPEECH SYNTHESIS ---
function speak(text) {
  if (!speechSynthesis) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(stripHtml(text));
  utterance.lang = 'vi-VN';
  utterance.rate = parseFloat(speechRate.value);
  utterance.onerror = (event) => showToast('Lỗi đọc văn bản', 'error');
  speechSynthesis.speak(utterance);
}

// --- FILE HANDLING (Upload, Drag, Paste) ---
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast('Tệp quá lớn (tối đa 5MB)', 'error');
    return;
  }
  currentFile = file;
  fileName.textContent = file.name;
  fileInfo.style.display = 'flex';
  event.target.value = '';
}
function readFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = (error) => reject(error);
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      reader.readAsText(file);
    } else if (file.type.includes('pdf')) {
      resolve(`[Nội dung PDF ${file.name} - cần xử lý thêm]`);
    } else {
      resolve(`[Nội dung tệp ${file.name}]`);
    }
  });
}
function removeCurrentFile() {
  currentFile = null;
  fileInfo.style.display = 'none';
}
function handleDropFile(e) {
  e.preventDefault();
  chatlog.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    fileUpload.files = e.dataTransfer.files;
    handleFileUpload({target: fileUpload});
  }
}
function handlePaste(e) {
  if (e.clipboardData && e.clipboardData.files.length) {
    fileUpload.files = e.clipboardData.files;
    handleFileUpload({target: fileUpload});
    e.preventDefault();
  } else if (e.clipboardData && e.clipboardData.getData("text/plain").startsWith("#")) {
    // Paste as markdown: inserts formatted content
    document.execCommand('insertHTML', false, marked.parse(e.clipboardData.getData("text/plain")));
    e.preventDefault();
  }
}

// --- IMAGE GENERATION ---
function generateImage() {
  const prompt = imgPromptInput.value.trim();
  if(!prompt) return;
  imggenLoader.style.display = "inline";
  imgPromptInput.disabled = true;
  const apiKey = customApiKey.value || TOGETHER_API_KEY;
  fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: IMG_MODEL_ID,
      prompt: prompt,
      n: 1,
      size: "512x512"
    })
  })
  .then(res => res.json())
  .then(data => {
    imggenLoader.style.display = "none";
    imgPromptInput.disabled = false;
    imgPromptInput.value = "";
    if(data.data && data.data.length && data.data[0].url) {
      addImgBubble(data.data[0].url, prompt);
      getCurrentHistory().push({role:"image", url: data.data[0].url, caption: prompt});
      saveChats();
    } else {
      addBubble("ai", "❌ Không tạo được ảnh! Hãy thử lại.");
    }
  })
  .catch(e => {
    imggenLoader.style.display = "none";
    imgPromptInput.disabled = false;
    addBubble("ai", "❌ Lỗi tạo ảnh!");
    showToast("Lỗi tạo ảnh", "error");
  });
}

// --- EXPORT/IMPORT ---
exportTxt.onclick = function() { exportChat('txt'); };
exportMd.onclick = function() { exportChat('md'); };
function exportChat(format) {
  const history = getCurrentHistory();
  let content = `Chat: ${chats[chatIndex].title}\n\n`;
  history.forEach(msg => {
    if (msg.role === 'user') {
      content += `Bạn: ${msg.content}\n\n`;
    } else if (msg.role === 'assistant') {
      content += `AI: ${msg.content}\n\n`;
    } else if (msg.role === 'image') {
      content += `Ảnh: ${msg.caption}\nURL: ${msg.url}\n\n`;
    }
  });
  if (format === 'md') {
    content = content.replace(/^Bạn:/gm, '**Bạn:**')
                    .replace(/^AI:/gm, '**AI:**')
                    .replace(/^Ảnh:/gm, '**Ảnh:**');
  }
  const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chats[chatIndex].title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().slice(0,10)}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`Đã xuất chat thành ${format.toUpperCase()}`, 'success');
}
function exportAllChats() {
  const blob = new Blob([JSON.stringify({chats, chatIndex, modelId}, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat_ai_all_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Đã sao lưu toàn bộ!", "success");
}
function importChats() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".json";
  inp.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        if (Array.isArray(data.chats)) {
          chats = data.chats;
          chatIndex = data.chatIndex || 0;
          modelId = data.modelId || modelSelect.value;
          saveChats();
          renderSidebar();
          renderChat();
          showToast("Nhập thành công!", "success");
        }
      } catch { showToast("Lỗi file nhập", "error"); }
    };
    reader.readAsText(file);
  };
  inp.click();
}

// --- SHORTCUTS ---
function setupShortcuts() {
  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "Enter") {
      sendMessage();
    } else if (e.ctrlKey && e.key === "m") {
      toggleTheme.click();
      e.preventDefault();
    } else if (e.ctrlKey && e.key === "n") {
      newChatBtn.click();
      e.preventDefault();
    } else if (e.ctrlKey && e.key === "k") {
      settingsBtn.click();
      e.preventDefault();
    } else if (e.ctrlKey && e.key === "ArrowUp") {
      // Focus previous chat
      if (chatIndex > 0) {
        chatIndex -= 1;
        renderSidebar(); renderChat(); saveChats();
      }
    } else if (e.ctrlKey && e.key === "ArrowDown") {
      if (chatIndex < chats.length-1) {
        chatIndex += 1;
        renderSidebar(); renderChat(); saveChats();
      }
    }
  });
}

// --- SHARE MESSAGE ---
function shareMessage(content) {
  if (navigator.share) {
    navigator.share({text: stripHtml(content)}).catch(()=>showToast("Không chia sẻ được", "error"));
  } else {
    navigator.clipboard.writeText(stripHtml(content));
    showToast("Đã sao chép nội dung để chia sẻ!", "success");
  }
}

// --- THINKING ANIMATION ---
let thinkingInterval = null;
function startThinkingAnimation() {
  setLoader(true);
  let dot = loader.querySelector('.dot');
  let count = 0;
  if(thinkingInterval) clearInterval(thinkingInterval);
  thinkingInterval = setInterval(()=>{
    count = (count+1)%4;
    dot.textContent = '.'.repeat(count);
  }, 400);
}
function stopThinkingAnimation() {
  let dot = loader.querySelector('.dot');
  dot.textContent = '';
  if(thinkingInterval) clearInterval(thinkingInterval);
  setLoader(false);
}

// --- TOAST ---
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  setTimeout(() => {toast.classList.remove('show');}, 3000);
}

// --- SNOW EFFECT ---
let snowCtx, W, H, mp = 60, particles = [];
function setupSnow() {
  snowCtx = snowCanvas.getContext('2d');
  W = window.innerWidth;
  H = window.innerHeight;
  snowCanvas.width = W;
  snowCanvas.height = H;
  particles = [];
  for(let i = 0; i < mp; i++) {
    particles.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: Math.random()*3 + 2,
      d: Math.random()*mp,
      vx: Math.random()*0.5-0.25,
      vy: Math.random()*1+0.5
    });
  }
}
function drawSnow() {
  if(!snowEnabled) {
    snowCtx.clearRect(0, 0, W, H);
    return;
  }
  snowCtx.clearRect(0, 0, W, H);
  snowCtx.globalAlpha = 0.85;
  snowCtx.fillStyle = "#fff";
  snowCtx.beginPath();
  for(let i = 0; i < mp; i++) {
    let p = particles[i];
    snowCtx.moveTo(p.x, p.y);
    snowCtx.arc(p.x, p.y, p.r, 0, Math.PI*2, true);
  }
  snowCtx.fill();
  updateSnow();
}
function updateSnow() {
  for(let i = 0; i < mp; i++) {
    let p = particles[i];
    p.y += p.vy;
    p.x += p.vx;
    if(p.y > H) {
      p.y = -10;
      p.x = Math.random()*W;
    }
    if(p.x > W || p.x < 0) {
      p.x = Math.random()*W;
    }
  }
}
function resizeSnow() {
  W = window.innerWidth;
  H = window.innerHeight;
  snowCanvas.width = W;
  snowCanvas.height = H;
  setupSnow();
}
window.addEventListener('resize', resizeSnow);

// --- UTILS ---
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// --- EVENTS ---
sendBtn.onclick = sendMessage;
promptInput.addEventListener("keydown", function(e){
  if(e.key==="Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
imggenBtn.onclick = generateImage;
imgPromptInput.addEventListener("keydown", function(e){
  if(e.key==="Enter") generateImage();
});
fileUpload.addEventListener('change', handleFileUpload);
removeFile.addEventListener('click', removeCurrentFile);
// Mic button
micBtn.addEventListener('mousedown', () => {
  if (recognition) recognition.start();
  else showToast('Trình nhận dạng giọng nói không khả dụng', 'error');
});
micBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (recognition) recognition.start();
});
// Chat new
newChatBtn.onclick = function() {
  chats.push({title:"Chat mới",history:[]});
  chatIndex = chats.length-1;
  renderSidebar();
  renderChat();
  chatTitle.textContent = "Chat mới";
  welcome.style.display = "";
  promptInput.value = "";
  imgPromptInput.value = "";
  currentFile = null;
  fileInfo.style.display = 'none';
  saveChats();
};
// Theme/settings
toggleTheme.onclick = function() {
  document.body.classList.toggle('dark');
  localStorage.setItem("theme", document.body.classList.contains("dark")?"dark":"");
  darkMode.checked = document.body.classList.contains('dark');
  saveSettings();
};
settingsBtn.onclick = function() {
  settingsPanel.classList.add('open');
  settingsOverlay.classList.add('active');
};
closeSettings.onclick = function() {
  settingsPanel.classList.remove('open');
  settingsOverlay.classList.remove('active');
  saveSettings();
};
settingsOverlay.onclick = function() {
  settingsPanel.classList.remove('open');
  settingsOverlay.classList.remove('active');
  saveSettings();
};
// Snow effect toggle
snowEffect.onchange = function() {
  snowEnabled = snowEffect.checked;
  snowSwitch.checked = snowEnabled;
  if(!snowEnabled) snowCtx.clearRect(0,0,W,H);
  saveSettings();
};
snowSwitch.onchange = function() {
  snowEnabled = snowSwitch.checked;
  snowEffect.checked = snowEnabled;
  if(!snowEnabled) snowCtx.clearRect(0,0,W,H);
  saveSettings();
};
// Dark mode toggle from settings
darkMode.onchange = function() {
  document.body.classList.toggle('dark', darkMode.checked);
  localStorage.setItem("theme", darkMode.checked ? "dark" : "");
  saveSettings();
};
// Auto speech toggle
autoSpeech.onchange = saveSettings;
speechRate.onchange = saveSettings;
customApiKey.onchange = saveSettings;
modelSelect.onchange = function() {
  modelId = modelSelect.value;
  saveChats();
};

init();
