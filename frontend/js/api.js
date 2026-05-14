const API_URL = window.location.origin.includes('localhost') ? 'http://localhost:3000/api' : '/api';

const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        
        const headers = {
            ...options.headers
        };

        // Eğer FormData değilse Content-Type ekle
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.hash = '#login';
                }
                throw new Error(data.error || 'Bir hata oluştu');
            }

            return data;
        } catch (error) {
            throw error;
        }
    },

    auth: {
        login: (credentials) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
        register: (userData) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
        getMe: () => api.request('/auth/me')
    },

    health: {
        addEntry: (data) => api.request('/health', { method: 'POST', body: JSON.stringify(data) }),
        getEntries: () => api.request('/health')
    },

    user: {
        getProfile: () => api.request('/user/profile'),
        updateProfile: (data) => api.request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
        changePassword: (data) => api.request('/user/change-password', { method: 'PUT', body: JSON.stringify(data) })
    },

    ai: {
        chat: (message, history) => api.request('/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
        analyzeImage: (formData) => api.request('/ai/analyze-image', { method: 'POST', body: formData }),
        generateReport: () => api.request('/ai/generate-report', { method: 'POST' }),
        getReports: () => api.request('/ai/reports')
    },

    admin: {
        getUsers: () => api.request('/admin/users'),
        getStats: () => api.request('/admin/stats'),
        getLogs: () => api.request('/admin/logs')
    }
};
