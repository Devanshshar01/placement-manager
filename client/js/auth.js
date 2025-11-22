class Auth {
    static async login(email, password, role) {
        if (!this.validateEmail(email)) throw new Error('Invalid email format');
        if (!password) throw new Error('Password is required');

        try {
            const response = await API.post('/auth/login', { email, password, role });
            console.log('Login response:', response); // Debug log

            // Extract token and user from response (handle different formats)
            const token = response.token || (response.data && response.data.token);
            const user = response.user || (response.data && response.data.user);

            if (token) {
                localStorage.setItem('token', token);
                console.log('Token stored:', token);
            }

            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                console.log('User stored:', user);
                return user;
            }

            throw new Error('Invalid response format from server');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    static async registerStudent(data) {
        this.validateRegistration(data);

        try {
            const response = await API.post('/auth/register/student', data);
            console.log('Register response:', response); // Debug log

            // Extract token and user from response
            const token = response.token || (response.data && response.data.token);
            const user = response.user || (response.data && response.data.user);

            if (token) {
                localStorage.setItem('token', token);
                console.log('Token stored:', token);
            }

            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                console.log('User stored:', user);
            }

            return response;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    static async registerAdmin(data) {
        if (!data.admin_key) throw new Error('Admin key is required');
        this.validateRegistration(data);

        try {
            const response = await API.post('/auth/register/admin', data);
            console.log('Admin register response:', response); // Debug log

            // Extract token and user from response
            const token = response.token || (response.data && response.data.token);
            const user = response.user || (response.data && response.data.user);

            if (token) {
                localStorage.setItem('token', token);
                console.log('Token stored:', token);
            }

            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                console.log('User stored:', user);
            }

            return response;
        } catch (error) {
            console.error('Admin register error:', error);
            throw error;
        }
    }

    static validateRegistration(data) {
        if (!data.name) throw new Error('Name is required');
        if (!this.validateEmail(data.email)) throw new Error('Invalid email format');
        if (data.password.length < 6) throw new Error('Password must be at least 6 characters');
    }

    static validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    if(!user) {
        console.log('User is falsy (inside if)');

    static setupMobileMenu() {
        const navContainer = document.querySelector('.nav-container');
        if (!navContainer) return;

        if (document.querySelector('.hamburger')) return;

        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger';
        hamburger.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        `;

        navContainer.insertBefore(hamburger, navContainer.firstChild);

        hamburger.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            const navLinks = document.querySelector('.nav-links');

            if (sidebar) {
                sidebar.classList.toggle('active');
                let overlay = document.querySelector('.sidebar-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.className = 'sidebar-overlay';
                    document.body.appendChild(overlay);
                    overlay.addEventListener('click', () => {
                        sidebar.classList.remove('active');
                        overlay.classList.remove('active');
                    });
                }
                overlay.classList.toggle('active');
            }
            else if (navLinks) {
                navLinks.classList.toggle('active');
            }
        });
    }

    // UI Helpers
    static showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger reflow
        toast.offsetHeight;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    static setLoading(btn, isLoading) {
        if (isLoading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = 'Loading...';
            btn.disabled = true;
        } else {
            btn.textContent = btn.dataset.originalText;
            btn.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    Auth.setupMobileMenu();
});
