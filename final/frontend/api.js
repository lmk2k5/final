// API Configuration
const API_BASE_URL = 'http://localhost:8888';

async function handleResponse(response) {
    const text = await response.text(); // read raw response
    if (!response.ok) {
        console.error("Server returned:", text); // log exact backend error
        let err;
        try {
            err = JSON.parse(text);
        } catch {
            err = { message: text };
        }
        throw new Error(err.message || err.error || 'Unknown error');
    }
    return JSON.parse(text);
}


// Authentication functions
const api = {
    // Authentication
    async signup(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: email, password })
        });
        return handleResponse(response);
    },

    async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: email, password })
        });
        const data = await handleResponse(response);
        if (data.token) {
            localStorage.setItem('jwt_token', data.token);
            localStorage.setItem('user_id', data.userId);
        }
        return data;
    },

    // Helper function to get auth headers
    getAuthHeaders() {
        const token = localStorage.getItem('jwt_token');
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    },

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('jwt_token');
    },

    // Logout
    logout() {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_id');
    },

    // Trip Management
    async getAllTrips() {
        const response = await fetch(`${API_BASE_URL}/api/dashboard`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return handleResponse(response);
    },

    async createTrip(tripData) {
        const response = await fetch(`${API_BASE_URL}/api/trips`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(tripData)
        });
        return handleResponse(response);
    },

    async getTripById(tripId) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return handleResponse(response);
    },

    async updateTrip(tripId, tripData) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(tripData)
        });
        return handleResponse(response);
    },

    async deleteTrip(tripId) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ _action: 'delete' })
        });
        return handleResponse(response);
    },

    // Day Management
    async addDay(tripId, dayData) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/days`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(dayData)
        });
        return handleResponse(response);
    },

    async updateDay(tripId, dayNumber, dayData) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/days/${dayNumber}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(dayData)
        });
        return handleResponse(response);
    },

    async deleteDay(tripId, dayNumber) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/days/${dayNumber}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ _action: 'delete' })
        });
        return handleResponse(response);
    },

    // Activity Management
    async addActivity(tripId, dayNumber, activityData) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/days/${dayNumber}/activities`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(activityData)
        });
        return handleResponse(response);
    },

    async updateActivity(tripId, dayNumber, activityName, activityData) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/days/${dayNumber}/activities/${activityName}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(activityData)
        });
        return handleResponse(response);
    },

    async deleteActivity(tripId, dayNumber, activityName) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/days/${dayNumber}/activities/${activityName}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ _action: 'delete' })
        });
        return handleResponse(response);
    },

    async reorderActivities(tripId, dayNumber, reorderData) {
        const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/days/${dayNumber}/reorder`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(reorderData)
        });
        return handleResponse(response);
    }
};

// Export the api object
export default api;