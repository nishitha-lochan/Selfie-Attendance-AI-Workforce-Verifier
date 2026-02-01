import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const login = async (employee_id, password) => {
  // Requires form data or json? Backend expects JSON for current implementation unless I used OAuth2PasswordRequestForm
  // My backend route uses LoginRequest pydantic model (JSON).
  const response = await api.post('/token', { employee_id, password });
  return response.data;
};

export const registerEmployee = async (formData) => {
  const response = await api.post('/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const markAttendance = async (data) => {
  const response = await api.post('/mark-attendance', data);
  return response.data;
};

export const getAttendance = async (date) => {
  const params = date ? { date } : {};
  const response = await api.get('/attendance', { params });
  return response.data;
};

export const deleteAttendance = async (id) => {
  const response = await api.delete(`/attendance/${id}`);
  return response.data;
};

export const getLivenessChallenge = async () => {
  const response = await api.get('/liveness/challenge');
  return response.data;
};
