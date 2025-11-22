class API {
    static async request(endpoint, method = 'GET', body = null) {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add token if exists (for Authorization header fallback)
        const token = localStorage.getItem('token'); // We are using cookies, but good to have fallback or for non-cookie auth
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
            credentials: 'include' // Important for cookies
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, config);
            const data = await response.json();
        }

            return data;
    } catch(error) {
        // Handle network errors
        if (error.message === 'Failed to fetch') {
            Auth.showToast('Connection failed. Please check your internet.', 'error');
        }
        throw error;
    }
}

    static get(endpoint) {
    return this.request(endpoint, 'GET');
}

    static post(endpoint, body) {
    return this.request(endpoint, 'POST', body);
}

    static put(endpoint, body) {
    return this.request(endpoint, 'PUT', body);
}

    static delete (endpoint) {
    return this.request(endpoint, 'DELETE');
}
}
