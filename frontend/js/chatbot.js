'use strict';
(function() {
    let root = document.getElementById('chatbot-root');
    if (!root) { root = document.createElement('div'); root.id = 'chatbot-root'; document.body.appendChild(root); }

    const API_URL = window.location.origin.includes('localhost') ? 'http://localhost:3000/api' : '/api';
    
    // Character SVG
    const charSvg = `
    <div class="chatbot-char" id="chatbotChar">
        <svg viewBox="0 0 80 80" fill="none">
            <defs>
                <linearGradient id="cCharGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#28cd41"/>
                    <stop offset="100%" stop-color="#1a8e2c"/>
                </linearGradient>
            </defs>
            <path d="M40 8C58 8 73 18 76 36C79 54 68 72 52 78C42 81 30 80 20 74C10 68 4 54 6 36C8 20 22 8 40 8Z" fill="url(#cCharGrad)"/>
            
            <!-- Doctor Hat -->
            <path d="M25 15 Q40 5 55 15 L55 22 Q40 12 25 22 Z" fill="white" stroke="#ddd" stroke-width="0.5"/>
            <path d="M37 12 H43 M40 9 V15" stroke="#ff3b30" stroke-width="2" stroke-linecap="round"/>

            <g class="h-arm-l" style="transform-origin:10px 44px;"><path d="M8 42Q-2 34 0 26" stroke="#146d22" stroke-width="5" stroke-linecap="round" fill="none"/></g>
            <g class="h-arm-r" style="transform-origin:70px 44px;"><path d="M72 42Q82 34 80 26" stroke="#146d22" stroke-width="5" stroke-linecap="round" fill="none"/></g>
            <ellipse class="h-eye" cx="28" cy="36" rx="7" ry="9" fill="white"/>
            <circle class="h-pupil" cx="28" cy="36" r="4" fill="#1D1D1F"/>
            <ellipse class="h-eye" cx="52" cy="36" rx="7" ry="9" fill="white"/>
            <circle class="h-pupil" cx="52" cy="36" r="4" fill="#1D1D1F"/>
            <path class="h-mouth" id="charMouth" d="M32 54Q40 62 48 54" stroke="#1D1D1F" stroke-width="2.5" stroke-linecap="round" fill="none"/>
            <ellipse class="h-mouth-excited" cx="40" cy="58" rx="7" ry="8" fill="#1D1D1F" opacity="0"/>
        </svg>
    </div>`;

    root.innerHTML = charSvg + `
    <div class="chatbot-window" id="chatbotWindow" role="dialog" aria-hidden="true">
        <div class="chatbot-header">
            <div class="chatbot-header-info">
                <div class="chatbot-avatar">🏥</div>
                <div>
                    <div class="chatbot-header-title" id="cb-title"></div>
                    <div class="chatbot-header-status" id="cb-status"></div>
                </div>
            </div>
            <button class="chatbot-close-btn" id="chatbotCloseBtn">✕</button>
        </div>
        <div class="chatbot-messages" id="chatbotMessages"></div>
        <div class="chatbot-quick-replies" id="chatbotQuickReplies"></div>
        <div class="chatbot-input-row">
            <input type="text" class="chatbot-input" id="chatbotInput">
            <button class="chatbot-send-btn" id="chatbotSendBtn">➤</button>
        </div>
    </div>`;

    const toggle = document.getElementById('chatbotChar');
    const windowEl = document.getElementById('chatbotWindow');
    const closeBtn = document.getElementById('chatbotCloseBtn');
    const messages = document.getElementById('chatbotMessages');
    const input = document.getElementById('chatbotInput');
    const sendBtn = document.getElementById('chatbotSendBtn');
    const quickRepliesEl = document.getElementById('chatbotQuickReplies');

    // Pupil tracking
    const pupils = toggle.querySelectorAll('.h-pupil');
    function setPupils(dx, dy) { pupils.forEach(p => p.setAttribute('transform', `translate(${dx},${dy})`)); }
    document.addEventListener('mousemove', (e) => {
        if (!toggle) return;
        const rect = toggle.getBoundingClientRect();
        const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const d = Math.hypot(dx, dy) || 1, f = Math.min(1, d / 80);
        setPupils((dx / d) * f * 4, (dy / d) * f * 4);
        if (d < 140) toggle.classList.add('excited'); else toggle.classList.remove('excited');
    });

    // Greeting animation
    setTimeout(() => { 
        if (toggle) {
            toggle.classList.add('greeting'); 
            setTimeout(() => toggle.classList.remove('greeting'), 1700); 
        }
    }, 1000);

    function addMsg(text, isUser) {
        if (!messages) return;
        const div = document.createElement('div');
        div.className = 'chatbot-msg ' + (isUser ? 'user' : 'bot');
        div.innerHTML = `
            <div class="chatbot-msg-avatar">${isUser ? '👤' : '🤖'}</div>
            <div class="chatbot-msg-bubble">${text}</div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function showTyping() {
        if (!messages) return;
        const div = document.createElement('div');
        div.className = 'chatbot-typing';
        div.id = 'typingIndicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    }

    async function processMessage(text) {
        if (!text.trim()) return;
        addMsg(text, true);
        input.value = '';
        showTyping();

        try {
            const res = await fetch(`${API_URL}/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text,
                    lang: i18n.currentLang
                })
            });
            const data = await res.json();
            const t = i18n.translations[i18n.currentLang];
            addMsg(data.response || t.chat_default_resp, false);
        } catch (error) {
            hideTyping();
            const t = i18n.translations[i18n.currentLang];
            addMsg(t.chat_error, false);
        }
    }

    if (toggle) {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = windowEl.classList.toggle('open');
            if (isOpen) {
                const t = i18n.translations[i18n.currentLang];
                const title = document.getElementById('cb-title');
                const status = document.getElementById('cb-status');
                const inputEl = document.getElementById('chatbotInput');
                if (title) title.textContent = t.chat_title;
                if (status) status.textContent = t.chat_status;
                if (inputEl) inputEl.placeholder = t.chat_placeholder;

                if (messages.children.length === 0) {
                    addMsg(t.chat_greet_1, false);
                    addMsg(t.chat_greet_2, false);
                }
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            windowEl.classList.remove('open');
        });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (windowEl && windowEl.classList.contains('open') && !windowEl.contains(e.target) && !toggle.contains(e.target)) {
            windowEl.classList.remove('open');
        }
    });

    if (windowEl) {
        // Prevent clicks inside window from closing it
        windowEl.addEventListener('click', (e) => e.stopPropagation());
    }

    if (sendBtn) sendBtn.addEventListener('click', () => processMessage(input.value));
    if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') processMessage(input.value); });

    // Sync with language changes
    window.addEventListener('langChanged', (e) => {
        const t = i18n.translations[e.detail];
        const title = document.getElementById('cb-title');
        const status = document.getElementById('cb-status');
        const inputEl = document.getElementById('chatbotInput');
        if (title) title.textContent = t.chat_title;
        if (status) status.textContent = t.chat_status;
        if (inputEl) inputEl.placeholder = t.chat_placeholder;
    });

})();
