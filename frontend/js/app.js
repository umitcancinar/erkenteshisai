// SPA Router and App Logic
const app = {
    user: null,
    chatHistory: [],
    chartInstance: null,

    init() {
        this.bindEvents();
        this.checkAuth();
        window.addEventListener('hashchange', () => this.router());
    },

    bindEvents() {
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    },

    showLoader() { document.getElementById('loader').classList.remove('hidden'); },
    hideLoader() { document.getElementById('loader').classList.add('hidden'); },

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.hash = '#login';
            return;
        }

        try {
            this.showLoader();
            this.user = await api.auth.getMe();
            document.getElementById('nav-username').textContent = this.user.username;
            document.getElementById('sidebar').classList.remove('hidden');
            
            // Show admin nav if user is admin
            if (this.user.role === 'admin') {
                document.getElementById('admin-nav').classList.remove('hidden');
            } else {
                document.getElementById('admin-nav').classList.add('hidden');
            }
            
            if (window.location.hash === '' || window.location.hash === '#login') {
                window.location.hash = '#dashboard';
            } else {
                this.router();
            }
        } catch (error) {
            this.logout();
        } finally {
            this.hideLoader();
        }
    },

    logout() {
        localStorage.removeItem('token');
        this.user = null;
        document.getElementById('sidebar').classList.add('hidden');
        window.location.hash = '#login';
    },

    updateNav(hash) {
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            }
        });
    },

    async router() {
        const viewContainer = document.getElementById('view-container');
        const hash = window.location.hash || '#login';
        
        // Redirect to login if not authenticated
        if (hash !== '#login' && !this.user) {
            window.location.hash = '#login';
            return;
        }

        this.updateNav(hash);
        viewContainer.innerHTML = ''; // Clear current view

        switch (hash) {
            case '#login':
                if (this.user) { window.location.hash = '#dashboard'; return; }
                document.getElementById('sidebar').classList.add('hidden');
                viewContainer.innerHTML = this.views.login();
                this.initLoginView();
                break;
            case '#dashboard':
                viewContainer.innerHTML = this.views.dashboard();
                await this.initDashboardView();
                break;
            case '#chat':
                viewContainer.innerHTML = this.views.chat();
                this.initChatView();
                break;
            case '#analysis':
                viewContainer.innerHTML = this.views.analysis();
                this.initAnalysisView();
                break;
            case '#reports':
                viewContainer.innerHTML = this.views.reports();
                await this.initReportsView();
                break;
            case '#admin':
                if (this.user.role !== 'admin') { window.location.hash = '#dashboard'; return; }
                viewContainer.innerHTML = this.views.admin();
                await this.initAdminView();
                break;
        }
    },

    // --- Views ---
    views: {
        login: () => `
            <div class="auth-container">
                <div class="glass-panel auth-box">
                    <div class="logo" style="justify-content: center; margin-bottom: 20px;">
                        <i class='bx bx-pulse' style="font-size: 40px"></i>
                    </div>
                    <h1>Erken Teşhis AI</h1>
                    <p>Sağlık asistanınıza giriş yapın</p>
                    
                    <form id="login-form">
                        <div class="form-group">
                            <label>E-posta</label>
                            <input type="email" id="login-email" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Şifre</label>
                            <input type="password" id="login-password" class="form-control" required>
                        </div>
                        <button type="submit" class="btn btn-primary">Giriş Yap</button>
                    </form>
                    
                    <div class="toggle-auth">
                        Hesabınız yok mu? <a href="#" id="show-register">Kayıt Ol</a>
                    </div>
                </div>
            </div>
        `,
        
        register: () => `
            <div class="auth-container">
                <div class="glass-panel auth-box">
                    <div class="logo" style="justify-content: center; margin-bottom: 20px;">
                        <i class='bx bx-pulse' style="font-size: 40px"></i>
                    </div>
                    <h1>Hesap Oluştur</h1>
                    <p>Erken teşhis hayat kurtarır</p>
                    
                    <form id="register-form">
                        <div class="form-group">
                            <label>Kullanıcı Adı</label>
                            <input type="text" id="reg-username" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>E-posta</label>
                            <input type="email" id="reg-email" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label>Şifre</label>
                            <input type="password" id="reg-password" class="form-control" required minlength="6">
                        </div>
                        <button type="submit" class="btn btn-accent">Kayıt Ol</button>
                    </form>
                    
                    <div class="toggle-auth">
                        Zaten hesabınız var mı? <a href="#" id="show-login">Giriş Yap</a>
                    </div>
                </div>
            </div>
        `,

        dashboard: () => `
            <div class="view-section page-header">
                <h1>Gösterge Paneli</h1>
                <p>Günlük sağlık verilerinizi girin ve takip edin.</p>
            </div>
            
            <div class="dashboard-grid view-section">
                <div class="col-8 glass-panel card">
                    <h2 style="margin-bottom: 20px;">Yeni Veri Girişi</h2>
                    <form id="health-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label>Nabız (bpm)</label>
                            <input type="number" id="h-pulse" class="form-control" placeholder="Örn: 72">
                        </div>
                        <div class="form-group">
                            <label>Tansiyon</label>
                            <input type="text" id="h-bp" class="form-control" placeholder="Örn: 120/80">
                        </div>
                        <div class="form-group">
                            <label>Kan Şekeri</label>
                            <input type="number" id="h-sugar" class="form-control" placeholder="Örn: 95">
                        </div>
                        <div class="form-group">
                            <label>Ateş (°C)</label>
                            <input type="number" step="0.1" id="h-temp" class="form-control" placeholder="Örn: 36.5">
                        </div>
                        <div class="form-group">
                            <label>Uyku (Saat)</label>
                            <input type="number" step="0.5" id="h-sleep" class="form-control" placeholder="Örn: 7.5">
                        </div>
                        <div class="form-group">
                            <label>Stres Seviyesi (1-10)</label>
                            <input type="number" min="1" max="10" id="h-stress" class="form-control" placeholder="Örn: 5">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Semptomlar / Notlar</label>
                            <input type="text" id="h-symptoms" class="form-control" placeholder="Baş ağrısı, halsizlik vb.">
                        </div>
                        <div style="grid-column: span 2;">
                            <button type="submit" class="btn btn-primary">Kaydet</button>
                        </div>
                    </form>
                </div>
                
                <div class="col-4" style="display: flex; flex-direction: column; gap: 24px;">
                    <div class="glass-panel card stat-card">
                        <div class="stat-icon"><i class='bx bx-pulse'></i></div>
                        <div class="stat-info">
                            <h3>Son Nabız</h3>
                            <p id="stat-pulse">--</p>
                        </div>
                    </div>
                    <div class="glass-panel card stat-card">
                        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--accent);"><i class='bx bx-moon'></i></div>
                        <div class="stat-info">
                            <h3>Son Uyku</h3>
                            <p id="stat-sleep">--</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-12 glass-panel card">
                    <h2 style="margin-bottom: 20px;">Nabız & Uyku Trendi</h2>
                    <canvas id="healthChart" height="80"></canvas>
                </div>
            </div>
        `,

        chat: () => `
            <div class="view-section page-header">
                <h1>Sağlık Danışmanı</h1>
                <p>Yapay zeka asistanımızla sağlık durumunuz hakkında konuşun.</p>
            </div>
            
            <div class="glass-panel chat-container view-section">
                <div class="chat-messages" id="chat-messages">
                    <div class="message msg-ai">
                        Merhaba, ben Erken Teşhis AI. Size nasıl yardımcı olabilirim? Herhangi bir semptomunuz mu var?
                    </div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="chat-input" placeholder="Şikayetiniz veya sorunuz nedir?" autocomplete="off">
                    <button id="chat-send"><i class='bx bx-send'></i></button>
                </div>
            </div>
        `,

        analysis: () => `
            <div class="view-section page-header">
                <h1>Görsel Analiz</h1>
                <p>Cilt, göz, ağız veya saçınızla ilgili bir fotoğraf yükleyerek ön teşhis alın.</p>
            </div>
            
            <div class="dashboard-grid view-section">
                <div class="col-6">
                    <div class="glass-panel card">
                        <h2 style="margin-bottom: 20px;">Fotoğraf Yükle</h2>
                        <div class="upload-area" id="drop-zone">
                            <i class='bx bx-cloud-upload upload-icon'></i>
                            <p>Fotoğrafı buraya sürükleyin veya seçmek için tıklayın</p>
                            <input type="file" id="file-input" class="hidden" accept="image/*">
                        </div>
                        <img id="image-preview" style="max-width: 100%; margin-top: 20px; border-radius: 8px; display: none;">
                        <button id="analyze-btn" class="btn btn-primary" style="margin-top: 20px; display: none; width: 100%;">Analiz Et</button>
                    </div>
                </div>
                <div class="col-6">
                    <div class="glass-panel card" style="height: 100%;">
                        <h2 style="margin-bottom: 20px;">Analiz Sonucu</h2>
                        <div id="analysis-result" style="line-height: 1.6; color: var(--text-muted);">
                            Fotoğraf yükledikten sonra analiz sonucu burada görüntülenecektir.
                        </div>
                    </div>
                </div>
            </div>
        `,

        reports: () => `
            <div class="view-section page-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1>Sağlık Raporları</h1>
                    <p>Geçmiş analizleriniz ve haftalık raporlarınız.</p>
                </div>
                <button id="generate-report-btn" class="btn btn-accent" style="width: auto;"><i class='bx bx-file-blank'></i> Yeni Rapor Oluştur</button>
            </div>
            
            <div class="view-section">
                <div class="glass-panel card">
                    <div id="reports-list" style="display: flex; flex-direction: column; gap: 16px;">
                        <!-- Reports will be listed here -->
                    </div>
                </div>
            </div>
        `,

        admin: () => `
            <div class="view-section page-header">
                <h1>Yönetim Paneli</h1>
                <p>Platform istatistikleri ve kullanıcı yönetimi.</p>
            </div>
            
            <div class="dashboard-grid view-section">
                <div class="col-4 glass-panel card stat-card">
                    <div class="stat-icon"><i class='bx bx-user'></i></div>
                    <div class="stat-info">
                        <h3>Toplam Kullanıcı</h3>
                        <p id="admin-stat-users">--</p>
                    </div>
                </div>
                <div class="col-4 glass-panel card stat-card">
                    <div class="stat-icon" style="color: var(--primary);"><i class='bx bx-data'></i></div>
                    <div class="stat-info">
                        <h3>Sağlık Verisi</h3>
                        <p id="admin-stat-entries">--</p>
                    </div>
                </div>
                <div class="col-4 glass-panel card stat-card">
                    <div class="stat-icon" style="color: var(--accent);"><i class='bx bx-brain'></i></div>
                    <div class="stat-info">
                        <h3>AI Analizleri</h3>
                        <p id="admin-stat-analyses">--</p>
                    </div>
                </div>
                
                <div class="col-12 glass-panel card">
                    <h2 style="margin-bottom: 20px;">Kullanıcı Listesi</h2>
                    <div style="overflow-x: auto;">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Kullanıcı Adı</th>
                                    <th>E-posta</th>
                                    <th>Rol</th>
                                    <th>Kayıt Tarihi</th>
                                </tr>
                            </thead>
                            <tbody id="admin-users-list">
                                <!-- Users will be listed here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="col-12 glass-panel card">
                    <h2 style="margin-bottom: 20px;">Sistem Aktivite Logları</h2>
                    <div id="admin-logs-list" style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Logs will be listed here -->
                    </div>
                </div>
            </div>
        `
    },

    // --- Init Views Functions ---

    initLoginView() {
        const form = document.getElementById('login-form');
        const showRegBtn = document.getElementById('show-register');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    this.showLoader();
                    const email = document.getElementById('login-email').value;
                    const password = document.getElementById('login-password').value;
                    const res = await api.auth.login({ email, password });
                    localStorage.setItem('token', res.token);
                    this.user = res.user;
                    this.showToast('Giriş başarılı');
                    window.location.hash = '#dashboard';
                } catch (error) {
                    this.showToast(error.message, 'error');
                } finally {
                    this.hideLoader();
                }
            });
        }

        if (showRegBtn) {
            showRegBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('view-container').innerHTML = this.views.register();
                this.initRegisterView();
            });
        }
    },

    initRegisterView() {
        const form = document.getElementById('register-form');
        const showLogBtn = document.getElementById('show-login');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    this.showLoader();
                    const username = document.getElementById('reg-username').value;
                    const email = document.getElementById('reg-email').value;
                    const password = document.getElementById('reg-password').value;
                    const res = await api.auth.register({ username, email, password });
                    localStorage.setItem('token', res.token);
                    this.user = res.user;
                    this.showToast('Kayıt başarılı');
                    window.location.hash = '#dashboard';
                } catch (error) {
                    this.showToast(error.message, 'error');
                } finally {
                    this.hideLoader();
                }
            });
        }

        if (showLogBtn) {
            showLogBtn.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('view-container').innerHTML = this.views.login();
                this.initLoginView();
            });
        }
    },

    async initDashboardView() {
        // Handle form submission
        const form = document.getElementById('health-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const data = {
                pulse: document.getElementById('h-pulse').value || null,
                blood_pressure: document.getElementById('h-bp').value || null,
                blood_sugar: document.getElementById('h-sugar').value || null,
                body_temperature: document.getElementById('h-temp').value || null,
                sleep_hours: document.getElementById('h-sleep').value || null,
                stress_level: document.getElementById('h-stress').value || null,
                symptoms: document.getElementById('h-symptoms').value || null,
            };

            try {
                this.showLoader();
                await api.health.addEntry(data);
                this.showToast('Veriler kaydedildi');
                form.reset();
                this.loadDashboardData();
            } catch (error) {
                this.showToast(error.message, 'error');
            } finally {
                this.hideLoader();
            }
        });

        await this.loadDashboardData();
    },

    async loadDashboardData() {
        try {
            const entries = await api.health.getEntries();
            if (entries.length > 0) {
                // Update stats
                document.getElementById('stat-pulse').textContent = entries[0].pulse ? entries[0].pulse + ' bpm' : '--';
                document.getElementById('stat-sleep').textContent = entries[0].sleep_hours ? entries[0].sleep_hours + ' sa' : '--';
                
                // Update chart
                const labels = entries.slice(0, 7).map(e => {
                    const d = new Date(e.date);
                    return d.getDate() + '/' + (d.getMonth()+1);
                }).reverse();
                
                const pulseData = entries.slice(0, 7).map(e => e.pulse).reverse();
                const sleepData = entries.slice(0, 7).map(e => e.sleep_hours).reverse();

                this.renderChart(labels, pulseData, sleepData);
            }
        } catch (error) {
            console.error('Error loading dashboard data', error);
        }
    },

    renderChart(labels, pulseData, sleepData) {
        const ctx = document.getElementById('healthChart').getContext('2d');
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
        
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = 'Inter';

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Nabız',
                        data: pulseData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Uyku (Saat)',
                        data: sleepData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: { type: 'linear', display: true, position: 'left' },
                    y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
                }
            }
        });
    },

    initChatView() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        const msgsContainer = document.getElementById('chat-messages');

        // Render existing history in UI if needed (just visual persistence during session)
        if (this.chatHistory.length > 0) {
            msgsContainer.innerHTML = '';
            this.chatHistory.forEach(msg => {
                const div = document.createElement('div');
                div.className = \`message \${msg.role === 'user' ? 'msg-user' : 'msg-ai'}\`;
                div.innerHTML = msg.text.replace(/\\n/g, '<br>');
                msgsContainer.appendChild(div);
            });
            msgsContainer.scrollTop = msgsContainer.scrollHeight;
        }

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            // Add user message to UI
            const userDiv = document.createElement('div');
            userDiv.className = 'message msg-user';
            userDiv.textContent = text;
            msgsContainer.appendChild(userDiv);
            msgsContainer.scrollTop = msgsContainer.scrollHeight;
            input.value = '';

            try {
                // Remove loader logic for chat to make it feel natural, add a typing indicator
                const typingDiv = document.createElement('div');
                typingDiv.className = 'message msg-ai';
                typingDiv.id = 'typing-indicator';
                typingDiv.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';
                msgsContainer.appendChild(typingDiv);
                msgsContainer.scrollTop = msgsContainer.scrollHeight;

                const res = await api.ai.chat(text, this.chatHistory);
                
                document.getElementById('typing-indicator').remove();

                // Add AI message to UI
                const aiDiv = document.createElement('div');
                aiDiv.className = 'message msg-ai';
                // Convert markdown-like response roughly
                aiDiv.innerHTML = res.reply.replace(/\\n/g, '<br>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
                msgsContainer.appendChild(aiDiv);
                msgsContainer.scrollTop = msgsContainer.scrollHeight;

                // Update history
                this.chatHistory.push({ role: 'user', text });
                this.chatHistory.push({ role: 'model', text: res.reply });
            } catch (error) {
                document.getElementById('typing-indicator')?.remove();
                this.showToast('Yanıt alınamadı', 'error');
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    },

    initAnalysisView() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const preview = document.getElementById('image-preview');
        const analyzeBtn = document.getElementById('analyze-btn');
        const resultDiv = document.getElementById('analysis-result');
        let selectedFile = null;

        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                handleFile(e.target.files[0]);
            }
        });

        const handleFile = (file) => {
            if (!file.type.startsWith('image/')) {
                this.showToast('Lütfen geçerli bir resim dosyası seçin', 'error');
                return;
            }
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
                analyzeBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        };

        analyzeBtn.addEventListener('click', async () => {
            if (!selectedFile) return;
            
            const formData = new FormData();
            formData.append('image', selectedFile);

            try {
                this.showLoader();
                resultDiv.innerHTML = '<div class="spinner"></div> Analiz ediliyor... Lütfen bekleyin.';
                const res = await api.ai.analyzeImage(formData);
                resultDiv.innerHTML = res.analysis.replace(/\\n/g, '<br>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
                this.showToast('Analiz tamamlandı');
            } catch (error) {
                resultDiv.innerHTML = 'Hata: ' + error.message;
                this.showToast('Analiz hatası', 'error');
            } finally {
                this.hideLoader();
            }
        });
    },

    async initReportsView() {
        const loadReports = async () => {
            try {
                this.showLoader();
                const reports = await api.ai.getReports();
                const list = document.getElementById('reports-list');
                
                if (reports.length === 0) {
                    list.innerHTML = '<p style="color: var(--text-muted)">Henüz bir raporunuz bulunmuyor.</p>';
                    return;
                }

                list.innerHTML = reports.map(r => \`
                    <div style="background: rgba(0,0,0,0.2); padding: 16px; border-radius: 8px; border: 1px solid var(--border);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: var(--text-muted);">
                            <span><i class='bx bx-time'></i> \${new Date(r.created_at).toLocaleString('tr-TR')}</span>
                            <span style="background: var(--primary); color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">\${r.type === 'report' ? 'Haftalık Rapor' : 'Görsel Analiz'}</span>
                        </div>
                        <div style="line-height: 1.6;">
                            \${r.content.replace(/\\n/g, '<br>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>')}
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                this.showToast('Raporlar yüklenemedi', 'error');
            } finally {
                this.hideLoader();
            }
        };

        await loadReports();

        document.getElementById('generate-report-btn').addEventListener('click', async () => {
            try {
                this.showLoader();
                await api.ai.generateReport();
                this.showToast('Yeni rapor oluşturuldu');
                await loadReports();
            } catch (error) {
                this.showToast(error.message, 'error');
            } finally {
                this.hideLoader();
            }
        });
    },

    async initAdminView() {
        try {
            this.showLoader();
            
            // Fetch stats
            const stats = await api.admin.getStats();
            document.getElementById('admin-stat-users').textContent = stats.users;
            document.getElementById('admin-stat-entries').textContent = stats.entries;
            document.getElementById('admin-stat-analyses').textContent = stats.analyses;

            // Fetch users
            const users = await api.admin.getUsers();
            const usersList = document.getElementById('admin-users-list');
            usersList.innerHTML = users.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.username}</td>
                    <td>${u.email}</td>
                    <td><span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 4px; font-size: 12px;">${u.role}</span></td>
                    <td>${new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                </tr>
            `).join('');

            // Fetch logs
            const logs = await api.admin.getLogs();
            const logsList = document.getElementById('admin-logs-list');
            logsList.innerHTML = logs.map(l => `
                <div style="font-size: 14px; padding: 8px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;">
                    <span><strong>${l.username}</strong>: ${l.type} işlemi gerçekleştirdi.</span>
                    <span style="color: var(--text-muted);">${new Date(l.created_at).toLocaleTimeString('tr-TR')}</span>
                </div>
            `).join('');

        } catch (error) {
            this.showToast('Yönetici verileri yüklenemedi', 'error');
        } finally {
            this.hideLoader();
        }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
