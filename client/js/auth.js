class Auth {
    static async login(email, password, role) {
        if (!this.validateEmail(email)) throw new Error('Invalid email format');
        if (!password) throw new Error('Password is required');

        try {
            const response = await API.post('/auth/login', { email, password, role });
            if (response.success || response.token) {
                // Store token in localStorage as requested
                if (response.token) {
                    localStorage.setItem('token', response.token);
                }
                localStorage.setItem('user', JSON.stringify(response.user));
                return response.user;
            }
        } catch (error) {
            throw error;
        }
    }

    static async registerStudent(data) {
        this.validateRegistration(data);
        return API.post('/auth/register/student', data);
    }

    static async registerAdmin(data) {
        if (!data.admin_key) throw new Error('Admin key is required');
        this.validateRegistration(data);
        return API.post('/auth/register/admin', data);
    }

    static validateRegistration(data) {
        if (!data.name) throw new Error('Name is required');
        if (!this.validateEmail(data.email)) throw new Error('Invalid email format');
        if (data.password.length < 6) throw new Error('Password must be at least 6 characters');
    }

}

    static checkRole(allowedRole) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = '/login.html';
        return null;
    }

    // Allow admin to access everything or strict check?
    // For this app, strict role check for dashboards
    if (user.role !== allowedRole && !(allowedRole === 'admin' && (user.role === 'super_admin' || user.role === 'placement_officer'))) {
        if (user.role === 'student') window.location.href = '/student/dashboard.html';
        else window.location.href = '/admin/dashboard.html';
        return null;
    }
    return user;
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
