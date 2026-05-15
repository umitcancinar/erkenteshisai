// SPA Router and App Logic
const app = {
    user: null,
    chatHistory: [],
    chartInstance: null,

    init() {
        this.initTheme();
        this.initI18n();
        this.bindEvents();
        this.initMobileMenu();
        window.addEventListener('hashchange', () => this.router());
        this.checkAuth();
        this.router();
    },

    initMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('show');
                sidebarOverlay.classList.toggle('show');
            });
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('show');
                sidebarOverlay.classList.remove('show');
            });
        }
    },

    initTheme() {
        const theme = localStorage.getItem('theme') || 'dark';
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            document.getElementById('theme-icon').className = 'bx bx-sun';
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('theme-icon').className = 'bx bx-moon';
        }

        document.getElementById('theme-toggle').addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            document.getElementById('theme-icon').className = isDark ? 'bx bx-sun' : 'bx bx-moon';
        });
    },

    initI18n() {
        i18n.apply();
        document.getElementById('lang-toggle').addEventListener('click', () => {
            i18n.toggle();
        });
    },

    bindEvents() {
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    },

    showLoader(messageKey) { 
        const loader = document.getElementById('loader');
        const loaderMsg = document.getElementById('loader-message');
        if (messageKey && loaderMsg) {
            loaderMsg.textContent = i18n.translations[i18n.currentLang][messageKey] || "";
        } else if (loaderMsg) {
            loaderMsg.textContent = "";
        }
        loader.classList.remove('hidden'); 
    },
    hideLoader() { 
        document.getElementById('loader').classList.add('hidden');
        const loaderMsg = document.getElementById('loader-message');
        if (loaderMsg) loaderMsg.textContent = "";
    },

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
        const headerLogin = document.getElementById('header-login');
        const headerRegister = document.getElementById('header-register');
        const headerWelcome = document.getElementById('header-user-welcome');

        const mobileToggle = document.getElementById('mobile-menu-toggle');

        if (!token) {
            this.user = null;
            if (headerLogin) headerLogin.classList.remove('hidden');
            if (headerRegister) headerRegister.classList.remove('hidden');
            if (headerWelcome) headerWelcome.classList.add('hidden');
            document.getElementById('sidebar').classList.add('hidden');
            if (mobileToggle) mobileToggle.classList.remove('logged-in');
            if (window.location.hash !== '#landing' && window.location.hash !== '#login' && window.location.hash !== '#register') {
                window.location.hash = '#landing';
            }
            return;
        }

        try {
            this.showLoader();
            this.user = await api.auth.getMe();
            
            // Header Sync
            if (headerLogin) headerLogin.classList.add('hidden');
            if (headerRegister) headerRegister.classList.add('hidden');
            if (headerWelcome) {
                headerWelcome.innerHTML = `<span data-i18n="welcome_user">Welcome, </span>${this.user.username}`;
                headerWelcome.classList.remove('hidden');
            }

            document.getElementById('nav-username').textContent = this.user.username;
            document.getElementById('sidebar').classList.remove('hidden');
            
            if (this.user.role === 'admin') {
                document.getElementById('admin-nav').classList.remove('hidden');
            } else {
                document.getElementById('admin-nav').classList.add('hidden');
            }
            
            const mobileToggle = document.getElementById('mobile-menu-toggle');
            if (mobileToggle) mobileToggle.classList.add('logged-in');
            
            if (window.location.hash === '' || window.location.hash === '#login' || window.location.hash === '#register') {
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
        
        const headerLogin = document.getElementById('header-login');
        const headerRegister = document.getElementById('header-register');
        const headerWelcome = document.getElementById('header-user-welcome');
        
        if (headerLogin) headerLogin.classList.remove('hidden');
        if (headerRegister) headerRegister.classList.remove('hidden');
        if (headerWelcome) headerWelcome.classList.add('hidden');

        document.getElementById('sidebar').classList.add('hidden');
        document.body.classList.remove('sidebar-active');
        document.getElementById('main-content').style.marginLeft = '0';
        document.getElementById('main-content').style.width = '100%';
        document.getElementById('main-content').style.padding = '0';
        window.location.hash = '#landing';
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
        const mainContent = document.getElementById('main-content');
        const hash = window.location.hash || '#landing';
        
        const sidebar = document.getElementById('sidebar');
        const mobileToggle = document.getElementById('mobile-menu-toggle');

        // Handle layout for non-auth pages
        if (hash === '#landing' || hash === '#login' || hash === '#register') {
            sidebar.classList.add('hidden');
            if (mobileToggle) mobileToggle.classList.remove('logged-in');
            document.body.classList.remove('sidebar-active');
            mainContent.style.marginLeft = '0';
            mainContent.style.width = '100%';
            mainContent.style.padding = '0';
        } else if (this.user) {
            sidebar.classList.remove('hidden');
            if (mobileToggle) mobileToggle.classList.add('logged-in');
            document.body.classList.add('sidebar-active');
            mainContent.style.marginLeft = 'var(--sidebar-width)';
            mainContent.style.width = 'calc(100% - var(--sidebar-width))';
            mainContent.style.padding = '84px 40px 40px';
        }

        // Close sidebar on mobile after route change
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebar && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        }

        // Redirect to landing if not authenticated
        if (hash !== '#landing' && hash !== '#login' && hash !== '#register' && !this.user) {
            window.location.hash = '#landing';
            return;
        }

        this.updateNav(hash);
        viewContainer.innerHTML = ''; // Clear current view
        
        switch (hash) {
            case '#landing':
                if (this.user) { window.location.hash = '#dashboard'; return; }
                viewContainer.innerHTML = this.views.landing();
                this.initLandingView();
                i18n.apply();
                break;
            case '#login':
                if (this.user) { window.location.hash = '#dashboard'; return; }
                viewContainer.innerHTML = this.views.login();
                this.initLoginView();
                i18n.apply();
                break;
            case '#register':
                if (this.user) { window.location.hash = '#dashboard'; return; }
                viewContainer.innerHTML = this.views.register();
                this.initRegisterView();
                i18n.apply();
                break;
            case '#dashboard':
                viewContainer.innerHTML = this.views.dashboard();
                await this.initDashboardView();
                i18n.apply();
                break;
            case '#data-entry':
                viewContainer.innerHTML = this.views.dataEntry();
                this.initDataEntryView();
                i18n.apply();
                break;
            case '#chat':
                viewContainer.innerHTML = this.views.chat();
                this.initChatView();
                i18n.apply();
                break;
            case '#analysis':
                viewContainer.innerHTML = this.views.analysis();
                this.initAnalysisView();
                i18n.apply();
                break;
            case '#reports':
                viewContainer.innerHTML = this.views.reports();
                await this.initReportsView();
                i18n.apply();
                break;
            case '#profile':
                viewContainer.innerHTML = this.views.profile();
                await this.initProfileView();
                i18n.apply();
                break;
            case '#face-id':
                viewContainer.innerHTML = this.views.faceId();
                this.initFaceIdView();
                i18n.apply();
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
        landing: () => `
            <div class="view-section" style="padding: 100px 20px 40px;">
                <div class="hero">
                    <div class="logo" style="justify-content: center; border: none; margin-bottom: 40px;">
                        <i class='bx bx-pulse' style="font-size: 60px"></i>
                        <h2 style="font-size: 32px;">ErkenTeşhis<span>AI</span></h2>
                    </div>
                    <h1 data-i18n="hero_title">Geleceğin Sağlık Takibi, <br>Bugünün Teknolojisiyle.</h1>
                    <p data-i18n="hero_desc">Yapay zeka destekli multimodal analizler, anlık sağlık danışmanlığı ve detaylı raporlama ile sağlığınızı bir adım öteden takip edin.</p>
                    <div style="display: flex; gap: 20px; justify-content: center;">
                        <button class="btn btn-primary" style="width: auto; padding: 16px 40px;" id="start-now" data-i18n="btn_start">Hemen Başlayın</button>
                        <button class="btn btn-glass" style="width: auto; padding: 16px 40px; border: 1px solid var(--primary);" id="hero-login" data-i18n="btn_login">Giriş Yap</button>
                    </div>
                </div>

                <div class="features-grid container" style="max-width: 1200px; margin: 80px auto;">
                    <div class="glass-panel feature-card">
                        <i class='bx bx-scan'></i>
                        <h3 data-i18n="feat_1_title">Multimodal Analysis</h3>
                        <p data-i18n="feat_1_desc">Analyze skin, eye and mouth photos with Gemini AI, learn potential risks in seconds.</p>
                    </div>
                    <div class="glass-panel feature-card">
                        <i class='bx bx-bot'></i>
                        <h3 data-i18n="feat_2_title">AI Health Assistant</h3>
                        <p data-i18n="feat_2_desc">Talk to your 24/7 active health consultant about your symptoms, get informed suggestions.</p>
                    </div>
                    <div class="glass-panel feature-card">
                        <i class='bx bx-line-chart'></i>
                        <h3 data-i18n="feat_3_title">Trend Tracking</h3>
                        <p data-i18n="feat_3_desc">Monitor your critical data like pulse, blood pressure and sugar with charts, notice the change in your health.</p>
                    </div>
                </div>

                <div class="how-it-works container" id="how-it-works-scroll" style="max-width: 1000px; margin: 120px auto;">
                    <h2 class="section-title" data-i18n="how_title">Nasıl Çalışır?</h2>
                    <div class="steps">
                        <div class="step">
                            <div class="step-num">1</div>
                            <h4 data-i18n="step_1_title">Verilerini Gir</h4>
                            <p data-i18n="step_1_desc">Günlük sağlık metriklerini ve semptomlarını kaydet.</p>
                        </div>
                        <div class="step">
                            <div class="step-num">2</div>
                            <h4 data-i18n="step_2_title">Analiz Al</h4>
                            <p data-i18n="step_2_desc">Fotoğraf yükle veya AI asistanınla detaylı sohbet et.</p>
                        </div>
                        <div class="step">
                            <div class="step-num">3</div>
                            <h4 data-i18n="step_3_title">Raporla</h4>
                            <p data-i18n="step_3_desc">Haftalık özetler ve doktor raporlarını anında oluştur.</p>
                        </div>
                    </div>
                </div>

                <div style="text-align: center; margin: 100px 0;">
                    <h2 style="margin-bottom: 24px;" data-i18n="cta_title">Hemen Ücretsiz Hesap Oluşturun</h2>
                    <button class="btn btn-accent" style="width: auto; padding: 16px 60px; margin: 0 auto;" id="cta-register" data-i18n="btn_register">Kayıt Ol</button>
                </div>
            </div>
        `,

        login: () => `
            <div class="auth-container">
                <div class="glass-panel auth-box" style="margin-top: 60px;">
                    <div class="logo" style="justify-content: center; margin-bottom: 20px;">
                        <i class='bx bx-pulse' style="font-size: 40px"></i>
                    </div>
                    <h1 data-i18n="login_title">Early Diagnosis AI</h1>
                    <p data-i18n="login_desc">Log in to your health assistant</p>
                    
                    <form id="login-form">
                        <div class="form-group">
                            <label data-i18n="lbl_email">E-posta</label>
                            <input type="email" id="login-email" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label data-i18n="lbl_password">Şifre</label>
                            <input type="password" id="login-password" class="form-control" required>
                        </div>
                        <div class="form-group" style="display: flex; align-items: flex-start; gap: 10px; margin-top: 20px;">
                            <input type="checkbox" id="login-kvkk" style="width: 18px; height: 18px; cursor: pointer; margin-top: 3px;">
                            <label for="login-kvkk" style="font-size: 13px; color: var(--text-muted); line-height: 1.4; cursor: pointer;" data-i18n="kvkk_consent">KVKK metnini okudum ve verilerimin işlenmesine onay veriyorum.</label>
                        </div>
                        <button type="submit" class="btn btn-primary" data-i18n="btn_login" style="margin-top: 15px;">Giriş Yap</button>
                    </form>
                    
                    <div class="toggle-auth">
                        <span data-i18n="no_acc">Hesabınız yok mu?</span> <a href="#register" id="show-register" data-i18n="nav_register">Kayıt Ol</a>
                    </div>
                </div>
            </div>
        `,
        
        register: () => `
            <div class="auth-container">
                <div class="glass-panel auth-box" style="margin-top: 60px;">
                    <div class="logo" style="justify-content: center; margin-bottom: 20px;">
                        <i class='bx bx-pulse' style="font-size: 40px"></i>
                    </div>
                    <h1 data-i18n="reg_title">Hesap Oluştur</h1>
                    <p data-i18n="reg_desc">Erken teşhis hayat kurtarır</p>
                    
                    <form id="register-form">
                        <div class="form-group">
                            <label data-i18n="lbl_username">Kullanıcı Adı</label>
                            <input type="text" id="reg-username" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label data-i18n="lbl_email">E-posta</label>
                            <input type="email" id="reg-email" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label data-i18n="lbl_password">Şifre</label>
                            <input type="password" id="reg-password" class="form-control" required minlength="6">
                        </div>
                        <div class="form-group" style="display: flex; align-items: flex-start; gap: 10px; margin-top: 20px;">
                            <input type="checkbox" id="reg-kvkk" style="width: 18px; height: 18px; cursor: pointer; margin-top: 3px;">
                            <label for="reg-kvkk" style="font-size: 13px; color: var(--text-muted); line-height: 1.4; cursor: pointer;" data-i18n="kvkk_consent">KVKK metnini okudum ve verilerimin işlenmesine onay veriyorum.</label>
                        </div>
                        <button type="submit" class="btn btn-accent" data-i18n="btn_register" style="margin-top: 15px;">Kayıt Ol</button>
                    </form>
                    
                    <div class="toggle-auth">
                        <span data-i18n="already_acc">Zaten hesabınız var mı?</span> <a href="#login" id="show-login" data-i18n="nav_login">Giriş Yap</a>
                    </div>
                </div>
            </div>
        `,

        dashboard: () => `
            <div class="view-section page-header">
                <h1 data-i18n="dashboard_title">Gösterge Paneli</h1>
                <p data-i18n="dashboard_desc">Günlük sağlık verilerinizi girin ve takip edin.</p>
            </div>
            
            <div class="dashboard-grid view-section">
                <div class="col-12" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
                    <div class="glass-panel card stat-card">
                        <div class="stat-icon"><i class='bx bx-pulse'></i></div>
                        <div class="stat-info">
                            <h3 data-i18n="pulse">Nabız</h3>
                            <p id="stat-pulse">--</p>
                        </div>
                    </div>
                    <div class="glass-panel card stat-card">
                        <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: var(--accent);"><i class='bx bx-moon'></i></div>
                        <div class="stat-info">
                            <h3 data-i18n="sleep">Uyku</h3>
                            <p id="stat-sleep">--</p>
                        </div>
                    </div>
                    <div class="glass-panel card stat-card">
                        <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;"><i class='bx bx-droplet'></i></div>
                        <div class="stat-info">
                            <h3 data-i18n="bp">Tansiyon</h3>
                            <p id="stat-bp">--</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-12 glass-panel card">
                    <h2 style="margin-bottom: 20px;" data-i18n="chart_title">Pulse & Sleep Trend</h2>
                    <canvas id="healthChart" height="80"></canvas>
                </div>
            </div>
        `,

        dataEntry: () => `
            <div class="view-section page-header">
                <h1 data-i18n="nav_data">Veriler</h1>
                <p>Günlük sağlık metriklerinizi buradan kaydedebilirsiniz.</p>
            </div>
            
            <div class="view-section" style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px;">
                <div class="glass-panel card">
                    <h2 style="margin-bottom: 20px;" data-i18n="btn_save">Save</h2>
                    <form id="health-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label data-i18n="pulse">Pulse (bpm)</label>
                            <input type="number" id="h-pulse" class="form-control" placeholder="72">
                        </div>
                        <div class="form-group">
                            <label data-i18n="bp">Blood Pressure</label>
                            <input type="text" id="h-bp" class="form-control" placeholder="120/80">
                        </div>
                        <div class="form-group">
                            <label data-i18n="sugar">Blood Sugar</label>
                            <input type="number" id="h-sugar" class="form-control" placeholder="95">
                        </div>
                        <div class="form-group">
                            <label data-i18n="temp">Fever (°C)</label>
                            <input type="number" step="0.1" id="h-temp" class="form-control" placeholder="36.5">
                        </div>
                        <div class="form-group">
                            <label data-i18n="sleep">Sleep (Hours)</label>
                            <input type="number" step="0.5" id="h-sleep" class="form-control" placeholder="7.5">
                        </div>
                        <div class="form-group">
                            <label data-i18n="stress">Stress Level (1-10)</label>
                            <input type="number" min="1" max="10" id="h-stress" class="form-control" placeholder="5">
                        </div>
                        <div class="form-group">
                            <label data-i18n="mood">Mood Score (1-10)</label>
                            <input type="number" min="1" max="10" id="h-mood" class="form-control" placeholder="7">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label data-i18n="symptoms">Symptoms / Notes</label>
                            <input type="text" id="h-symptoms" class="form-control" placeholder="...">
                        </div>
                        <div style="grid-column: span 2;">
                            <button type="submit" class="btn btn-primary" data-i18n="btn_save">Save</button>
                        </div>
                    </form>
                </div>

                <div class="glass-panel card">
                    <h2 style="margin-bottom: 20px;" data-i18n="history_data">Historical Data</h2>
                    <div style="overflow-x: auto;">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th data-i18n="table_date">Date</th>
                                    <th data-i18n="table_pulse">Pulse</th>
                                    <th data-i18n="table_bp">B.P.</th>
                                    <th data-i18n="table_stress">Stress</th>
                                    <th data-i18n="table_mood">Mood</th>
                                </tr>
                            </thead>
                            <tbody id="data-history-list">
                                <!-- Data will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `,

        profile: () => `
            <div class="view-section page-header">
                <h1 data-i18n="profile_title">Kullanıcı Bilgileri</h1>
                <p data-i18n="profile_desc">Kişisel bilgilerinizi ve şifrenizi buradan güncelleyebilirsiniz.</p>
            </div>
            
            <div class="dashboard-grid view-section">
                <div class="col-6">
                    <div class="glass-panel card">
                        <h2 style="margin-bottom: 20px;" data-i18n="nav_profile">Profil Bilgileri</h2>
                        <form id="profile-form">
                            <div class="form-group">
                                <label data-i18n="lbl_height">Boy (cm)</label>
                                <input type="number" id="p-height" class="form-control">
                            </div>
                            <div class="form-group">
                                <label data-i18n="lbl_weight">Kilo (kg)</label>
                                <input type="number" id="p-weight" class="form-control">
                            </div>
                            <div class="form-group">
                                <label data-i18n="lbl_gender">Cinsiyet</label>
                                <select id="p-gender" class="form-control">
                                    <option value="Erkek">Erkek</option>
                                    <option value="Kadın">Kadın</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary" data-i18n="btn_update">Güncelle</button>
                        </form>
                    </div>
                </div>
                
                <div class="col-6">
                    <div class="glass-panel card">
                        <h2 style="margin-bottom: 20px;" data-i18n="lbl_password">Şifre Değiştir</h2>
                        <form id="password-form">
                            <div class="form-group">
                                <label data-i18n="lbl_current_pass">Mevcut Şifre</label>
                                <input type="password" id="p-current-pass" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label data-i18n="lbl_new_pass">Yeni Şifre</label>
                                <input type="password" id="p-new-pass" class="form-control" required minlength="6">
                            </div>
                            <button type="submit" class="btn btn-accent" data-i18n="btn_change_pass">Şifreyi Değiştir</button>
                        </form>
                    </div>
                </div>
            </div>
        `,

        faceId: () => `
            <div class="view-section page-header">
                <h1 data-i18n="auto_data_header">Otomatik Veri Entegrasyonu</h1>
                <p data-i18n="auto_data_desc">Bu panelden cihazınızdaki ve uygulamalarınızdaki verilerin AI modelimize aktarımını yönetebilirsiniz.</p>
            </div>
            
            <div class="view-section" style="max-width: 800px; margin: 0 auto;">
                <div class="glass-panel" style="padding: 0; border-radius: 20px; overflow: hidden; border: 1px solid var(--border);">
                    <div class="settings-list">
                        <!-- Face Recognition -->
                        <div class="settings-item-container">
                            <div class="settings-item" onclick="app.toggleWhy('why-face')">
                                <div class="item-left">
                                    <div class="item-icon" style="background: rgba(0, 113, 227, 0.1); color: #0071e3;"><i class='bx bx-face'></i></div>
                                    <span data-i18n="face_label">Yüz Tanıma</span>
                                </div>
                                <div class="item-right">
                                    <label class="apple-switch">
                                        <input type="checkbox" id="auto-face" onchange="event.stopPropagation()">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            <div id="why-face" class="why-section">
                                <p data-i18n="why_face">Yüz hatlarınızdan stres, yorgunluk ve cilt sağlığı analizi yapabilmek için.</p>
                            </div>
                        </div>

                        <!-- Blood Pressure -->
                        <div class="settings-item-container">
                            <div class="settings-item" onclick="app.toggleWhy('why-bp')">
                                <div class="item-left">
                                    <div class="item-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;"><i class='bx bx-droplet'></i></div>
                                    <span data-i18n="bp_label">Tansiyon Aleti</span>
                                </div>
                                <div class="item-right">
                                    <label class="apple-switch">
                                        <input type="checkbox" id="auto-bp" onchange="event.stopPropagation()">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            <div id="why-bp" class="why-section">
                                <p data-i18n="why_bp">Tansiyon verilerinizi takip ederek kardiyovasküler risk analizi sunabilmek için.</p>
                            </div>
                        </div>

                        <!-- Sleep -->
                        <div class="settings-item-container">
                            <div class="settings-item" onclick="app.toggleWhy('why-sleep')">
                                <div class="item-left">
                                    <div class="item-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;"><i class='bx bx-moon'></i></div>
                                    <span data-i18n="sleep_label">Uyku Takibi</span>
                                </div>
                                <div class="item-right">
                                    <label class="apple-switch">
                                        <input type="checkbox" id="auto-sleep" onchange="event.stopPropagation()">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            <div id="why-sleep" class="why-section">
                                <p data-i18n="why_sleep">Uyku kalitenizin genel sağlığınız üzerindeki etkilerini raporlayabilmek için.</p>
                            </div>
                        </div>

                        <!-- Health App -->
                        <div class="settings-item-container">
                            <div class="settings-item" onclick="app.toggleWhy('why-health')">
                                <div class="item-left">
                                    <div class="item-icon" style="background: rgba(255, 159, 10, 0.1); color: #ff9f0a;"><i class='bx bx-heart'></i></div>
                                    <span data-i18n="health_app_label">Sağlık Uygulaması Verileri</span>
                                </div>
                                <div class="item-right">
                                    <label class="apple-switch">
                                        <input type="checkbox" id="auto-health" onchange="event.stopPropagation()">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            <div id="why-health" class="why-section">
                                <p data-i18n="why_health">Fiziksel aktivite ve diğer sağlık metriklerinizi merkezi bir noktada toplamak için.</p>
                            </div>
                        </div>

                        <!-- Google Search -->
                        <div class="settings-item-container">
                            <div class="settings-item" onclick="app.toggleWhy('why-google')">
                                <div class="item-left">
                                    <div class="item-icon" style="background: rgba(144, 144, 144, 0.1); color: #909090;"><i class='bx bxl-google'></i></div>
                                    <span data-i18n="google_search_label">Google Arama Kayıtları</span>
                                </div>
                                <div class="item-right">
                                    <label class="apple-switch">
                                        <input type="checkbox" id="auto-google" onchange="event.stopPropagation()">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            <div id="why-google" class="why-section">
                                <p data-i18n="why_google">Sağlık odaklı aramalarınızı analiz ederek olası endişelerinizi anlamak için.</p>
                            </div>
                        </div>

                        <!-- User Habits -->
                        <div class="settings-item-container">
                            <div class="settings-item" onclick="app.toggleWhy('why-habits')">
                                <div class="item-left">
                                    <div class="item-icon" style="background: rgba(88, 86, 214, 0.1); color: #5856d6;"><i class='bx bx-time-five'></i></div>
                                    <span data-i18n="user_habits_label">Cihaz Kullanım Alışkanlıkları</span>
                                </div>
                                <div class="item-right">
                                    <label class="apple-switch">
                                        <input type="checkbox" id="auto-habits" onchange="event.stopPropagation()">
                                        <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            <div id="why-habits" class="why-section">
                                <p data-i18n="why_habits">Ekran süresi, parlaklık seviyesi ve en çok vakit geçirilen uygulamaların analizi ile kullanım alışkanlıklarınızın sağlığınız üzerindeki etkisini ölçmek için.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 50px; text-align: center; font-size: 24px; font-weight: 800; color: var(--accent); letter-spacing: 1px; text-transform: uppercase; animation: fadeIn 1s ease-out;">
                    BU KISIM HENÜZ KULLANIMA AÇILMAMIŞTIR
                </div>
            </div>
            
        `,

        chat: () => `
            <div class="view-section page-header">
                <h1 data-i18n="nav_chat">Sağlık Danışmanı</h1>
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
                <h1 data-i18n="nav_analysis">Manual Analysis</h1>
                <p data-i18n="analysis_desc">Get detailed diagnosis by uploading photos, stating your symptoms, and scoring your mood.</p>
            </div>
            
            <div class="dashboard-grid view-section">
                <div class="col-6">
                    <div class="glass-panel card">
                        <h2 style="margin-bottom: 20px;" data-i18n="analysis_header">Prepare Data</h2>
                        <div class="upload-area" id="drop-zone" style="margin-bottom: 24px;">
                            <i class='bx bx-cloud-upload upload-icon'></i>
                            <p data-i18n="analysis_upload">Drag and drop photo here or click to select</p>
                            <input type="file" id="file-input" class="hidden" accept="image/*">
                        </div>
                        <img id="image-preview" style="max-width: 100%; margin-bottom: 24px; border-radius: 12px; display: none;">
                        
                        <div class="form-group">
                            <label data-i18n="analysis_symptoms_lbl">Symptoms / Complaints</label>
                            <textarea id="analysis-symptoms" class="form-control" rows="3" data-i18n="analysis_data_placeholder" placeholder="e.g. Redness and itching in my eyes..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label data-i18n="analysis_mood_lbl">Mood Score (0 - 10)</label>
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <input type="range" id="analysis-mood" min="0" max="10" step="1" value="5" style="flex: 1;">
                                <span id="mood-val" style="font-weight: 700; color: var(--primary); font-size: 18px;">5</span>
                            </div>
                        </div>

                        <button id="analyze-btn" class="btn btn-primary" style="margin-top: 20px; width: 100%; display: none;" data-i18n="btn_analyze">Analyze Now</button>
                    </div>
                </div>
                <div class="col-6">
                    <div class="glass-panel card" style="height: 100%;">
                        <h2 style="margin-bottom: 20px;" data-i18n="analysis_result_title">Analysis Result</h2>
                        <div id="analysis-result" style="line-height: 1.7; color: var(--text-muted);" data-i18n="analysis_placeholder">
                            Analysis result will appear here after completing data entry.
                        </div>
                    </div>
                </div>
            </div>
        `,

        reports: () => `
            <div class="view-section page-header" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h1 data-i18n="nav_reports">Health Reports</h1>
                    <p data-i18n="reports_desc">Your past analyses and weekly reports.</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button id="generate-summary-btn" class="btn btn-primary" style="width: auto;" data-i18n="btn_doc_summary"><i class='bx bx-list-check'></i> Doctor Summary</button>
                    <button id="generate-report-btn" class="btn btn-accent" style="width: auto;" data-i18n="btn_weekly_analysis"><i class='bx bx-file-blank'></i> Weekly Analysis</button>
                </div>
            </div>
            
            <div class="view-section">
                <div id="reports-list" style="display: flex; flex-direction: column; gap: 16px;">
                    <!-- Reports will be listed here -->
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

    initLandingView() {
        document.getElementById('start-now').addEventListener('click', () => {
            window.location.hash = '#login';
        });
        document.getElementById('hero-login').addEventListener('click', () => {
            window.location.hash = '#login';
        });
        document.getElementById('cta-register').addEventListener('click', () => {
            document.getElementById('view-container').innerHTML = this.views.register();
            this.initRegisterView();
        });
    },

    initLoginView() {
        const form = document.getElementById('login-form');
        const showRegBtn = document.getElementById('show-register');

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const kvkk = document.getElementById('login-kvkk').checked;
                    if (!kvkk) {
                        this.showToast(i18n.translations[i18n.currentLang].kvkk_error || 'Lütfen KVKK onayını kabul edin', 'error');
                        return;
                    }

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
                    const kvkk = document.getElementById('reg-kvkk').checked;
                    if (!kvkk) {
                        this.showToast(i18n.translations[i18n.currentLang].kvkk_error || 'Lütfen KVKK onayını kabul edin', 'error');
                        return;
                    }

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
        await this.loadDashboardData();
    },

    async initDataEntryView() {
        const loadHistory = async () => {
            try {
                const entries = await api.health.getEntries();
                const list = document.getElementById('data-history-list');
                if (list) {
                    list.innerHTML = entries.slice(0, 5).map(e => `
                        <tr>
                            <td>${new Date(e.date).toLocaleDateString('tr-TR')}</td>
                            <td>${e.pulse || '-'}</td>
                            <td>${e.blood_pressure || '-'}</td>
                            <td>${e.stress_level || '-'}</td>
                            <td>${e.mood_score || '-'}</td>
                        </tr>
                    `).join('');
                }
            } catch (error) { console.error(error); }
        };

        await loadHistory();

        const form = document.getElementById('health-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                pulse: document.getElementById('h-pulse').value || null,
                blood_pressure: document.getElementById('h-bp').value || null,
                blood_sugar: document.getElementById('h-sugar').value || null,
                body_temperature: document.getElementById('h-temp').value || null,
                sleep_hours: document.getElementById('h-sleep').value || null,
                stress_level: document.getElementById('h-stress').value || null,
                mood_score: document.getElementById('h-mood').value || null,
                symptoms: document.getElementById('h-symptoms').value || null,
            };
            try {
                this.showLoader();
                await api.health.addEntry(data);
                this.showToast('Veriler kaydedildi');
                form.reset();
                await loadHistory();
                window.location.hash = '#dashboard';
            } catch (error) {
                this.showToast(error.message, 'error');
            } finally {
                this.hideLoader();
            }
        });
    }
},

    async initProfileView() {
        try {
            this.showLoader();
            const profile = await api.user.getProfile();
            document.getElementById('p-height').value = profile.height || '';
            document.getElementById('p-weight').value = profile.weight || '';
            document.getElementById('p-gender').value = profile.gender || 'Erkek';
            
            const pForm = document.getElementById('profile-form');
            pForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const data = {
                    height: document.getElementById('p-height').value,
                    weight: document.getElementById('p-weight').value,
                    gender: document.getElementById('p-gender').value
                };
                try {
                    this.showLoader();
                    await api.user.updateProfile(data);
                    this.showToast('Profil güncellendi');
                } catch (error) {
                    this.showToast(error.message, 'error');
                } finally {
                    this.hideLoader();
                }
            });

            const passForm = document.getElementById('password-form');
            passForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const currentPassword = document.getElementById('p-current-pass').value;
                const newPassword = document.getElementById('p-new-pass').value;
                try {
                    this.showLoader();
                    await api.user.changePassword({ currentPassword, newPassword });
                    this.showToast('Şifre değiştirildi');
                    passForm.reset();
                } catch (error) {
                    this.showToast(error.message, 'error');
                } finally {
                    this.hideLoader();
                }
            });

        } catch (error) {
            this.showToast('Profil yüklenemedi', 'error');
        } finally {
            this.hideLoader();
        }
    },

    async loadDashboardData() {
        try {
            const entries = await api.health.getEntries();
            if (entries.length > 0) {
                // Update stats
                document.getElementById('stat-pulse').textContent = entries[0].pulse ? entries[0].pulse + ' bpm' : '--';
                document.getElementById('stat-sleep').textContent = entries[0].sleep_hours ? entries[0].sleep_hours + ' sa' : '--';
                document.getElementById('stat-bp').textContent = entries[0].blood_pressure || '--';
                
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

        if (this.chatHistory.length > 0) {
            msgsContainer.innerHTML = '';
            this.chatHistory.forEach(msg => {
                const div = document.createElement('div');
                div.className = `message ${msg.role === 'user' ? 'msg-user' : 'msg-ai'}`;
                div.innerHTML = msg.text.replace(/\n/g, '<br>');
                msgsContainer.appendChild(div);
            });
            msgsContainer.scrollTop = msgsContainer.scrollHeight;
        }

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            const userDiv = document.createElement('div');
            userDiv.className = 'message msg-user';
            userDiv.textContent = text;
            msgsContainer.appendChild(userDiv);
            msgsContainer.scrollTop = msgsContainer.scrollHeight;
            input.value = '';

            try {
                const typingDiv = document.createElement('div');
                typingDiv.className = 'message msg-ai';
                typingDiv.id = 'typing-indicator';
                typingDiv.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>';
                msgsContainer.appendChild(typingDiv);
                msgsContainer.scrollTop = msgsContainer.scrollHeight;

                const res = await api.ai.chat(text, this.chatHistory);
                
                document.getElementById('typing-indicator').remove();

                const aiDiv = document.createElement('div');
                aiDiv.className = 'message msg-ai';
                aiDiv.innerHTML = res.response.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                msgsContainer.appendChild(aiDiv);
                msgsContainer.scrollTop = msgsContainer.scrollHeight;

                this.chatHistory.push({ role: 'user', text: message });
                this.chatHistory.push({ role: 'model', text: res.response });
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
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });

        const handleFile = (file) => {
            if (!file.type.startsWith('image/')) { this.showToast('Geçerli bir resim seçin', 'error'); return; }
            selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => { preview.src = e.target.result; preview.style.display = 'block'; analyzeBtn.style.display = 'block'; };
            reader.readAsDataURL(file);
        };

        const moodInput = document.getElementById('analysis-mood');
        const moodVal = document.getElementById('mood-val');
        if (moodInput) {
            moodInput.addEventListener('input', (e) => moodVal.textContent = e.target.value);
        }

        analyzeBtn.addEventListener('click', async () => {
            if (!selectedFile) return;
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('symptoms', document.getElementById('analysis-symptoms').value);
            formData.append('moodScore', document.getElementById('analysis-mood').value);
            formData.append('lang', i18n.currentLang);
            
            try {
                this.showLoader('loading_image');
                
                // Professional progress simulation
                setTimeout(() => this.showLoader('loading_analyze'), 1500);
                setTimeout(() => this.showLoader('loading_report'), 3000);
                setTimeout(() => this.showLoader('loading_connect'), 4500);
                setTimeout(() => this.showLoader('loading_finalizing'), 6000);

                resultDiv.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner" style="margin: 0 auto 20px;"></div><p data-i18n="loading_analyze">Analyzing...</p></div>';
                
                const res = await api.ai.analyzeImage(formData, i18n.currentLang);
                resultDiv.innerHTML = res.analysis.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                this.showToast('Analysis completed');
            } catch (error) {
                resultDiv.innerHTML = 'Error: ' + error.message;
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
                if (reports.length === 0) { list.innerHTML = '<p style="color: var(--text-muted)">Henüz bir raporunuz bulunmuyor.</p>'; return; }
                list.innerHTML = reports.map(r => `
                    <div class="glass-panel card report-item" style="padding: 0; overflow: hidden; margin-bottom: 12px;">
                        <div class="report-header" style="padding: 16px 24px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03);">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <i class='bx bx-chevron-right report-chevron' style="transition: transform 0.3s ease;"></i>
                                <span style="font-weight: 500;">${new Date(r.created_at).toLocaleString('tr-TR')}</span>
                            </div>
                            <span class="badge" style="background: var(--primary); color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">${r.type.toUpperCase()}</span>
                        </div>
                        <div class="report-content" style="padding: 0 24px; max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s ease;">
                            <div style="padding: 24px 0; border-top: 1px solid var(--border); line-height: 1.7; color: var(--text-muted);">
                                ${r.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
                            </div>
                        </div>
                    </div>
                `).join('');

                // Add toggle logic
                document.querySelectorAll('.report-header').forEach(header => {
                    header.addEventListener('click', () => {
                        const item = header.parentElement;
                        const content = item.querySelector('.report-content');
                        const chevron = item.querySelector('.report-chevron');
                        const isOpen = item.classList.toggle('open');
                        
                        if (isOpen) {
                            content.style.maxHeight = content.scrollHeight + 'px';
                            content.style.padding = '0 24px';
                            chevron.style.transform = 'rotate(90deg)';
                        } else {
                            content.style.maxHeight = '0';
                            chevron.style.transform = 'rotate(0deg)';
                        }
                    });
                });
            } catch (error) { this.showToast('Raporlar yüklenemedi', 'error'); } finally { this.hideLoader(); }
        };
        await loadReports();
        
        document.getElementById('generate-report-btn').addEventListener('click', async () => {
            try {
                this.showLoader('loading_report');
                await api.ai.generateReport(i18n.currentLang);
                this.showToast('Report generated');
                loadReports();
            } catch (error) {
                this.showToast(error.message, 'error');
            } finally { this.hideLoader(); }
        });

        document.getElementById('generate-summary-btn').addEventListener('click', async () => {
            try {
                this.showLoader('loading_report');
                await api.ai.generateDoctorSummary(i18n.currentLang);
                this.showToast('Doctor summary generated');
                loadReports();
            } catch (error) {
                this.showToast(error.message, 'error');
            } finally { this.hideLoader(); }
        });
    },

    async initAdminView() {
        try {
            this.showLoader();
            const stats = await api.admin.getStats();
            document.getElementById('admin-stat-users').textContent = stats.users;
            document.getElementById('admin-stat-entries').textContent = stats.entries;
            document.getElementById('admin-stat-analyses').textContent = stats.analyses;
            const users = await api.admin.getUsers();
            document.getElementById('admin-users-list').innerHTML = users.map(u => `<tr><td>${u.id}</td><td>${u.username}</td><td>${u.email}</td><td>${u.role}</td><td>${new Date(u.created_at).toLocaleDateString()}</td></tr>`).join('');
            const logs = await api.admin.getLogs();
            document.getElementById('admin-logs-list').innerHTML = logs.map(l => `<div style="padding: 8px; border-bottom: 1px solid var(--border);">${l.username}: ${l.type} - ${new Date(l.created_at).toLocaleTimeString()}</div>`).join('');
        } catch (error) { this.showToast('Hata', 'error'); } finally { this.hideLoader(); }
    },

    initFaceIdView() {
        const toggles = [
            'auto-face', 'auto-bp', 'auto-sleep', 'auto-health', 'auto-google', 'auto-habits'
        ];

        toggles.forEach(id => {
            const toggle = document.getElementById(id);
            if (toggle) {
                const isEnabled = localStorage.getItem(`setting-${id}`) === 'true';
                toggle.checked = isEnabled;
                
                toggle.addEventListener('change', (e) => {
                    const enabled = e.target.checked;
                    localStorage.setItem(`setting-${id}`, enabled);
                    this.showToast(enabled ? 'Özellik etkinleştirildi' : 'Özellik devre dışı bırakıldı');
                });
            }
        });
    },

    toggleWhy(id) {
        const section = document.getElementById(id);
        if (section) {
            const isActive = section.classList.toggle('active');
            // Close others
            document.querySelectorAll('.why-section').forEach(s => {
                if (s.id !== id) s.classList.remove('active');
            });
        }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
