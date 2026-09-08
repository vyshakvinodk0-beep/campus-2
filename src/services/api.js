import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor to handle 401 gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('API 401 Unauthorized encountered, clearing stale token');
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  sendOtp: (email, purpose = 'verification') => api.post('/auth/send-otp', { email, purpose }),
  verifyOtp: (email, otp, purpose = 'verification', autoLogin = false) => api.post('/auth/verify-otp', { email, otp, purpose, auto_login: autoLogin }),
  checkGoogleEmail: (email) => api.post('/auth/google-check-email', { email }),
  googleOAuth: (payload) => api.post('/auth/google-oauth', payload),
  googleRegister: (email, fullName, department = 'Computer Science & Engineering', token = null) =>
    api.post('/auth/google-register', { email, full_name: fullName, department, token }),
  googleLogin: (email, fullName = 'Google User', role = 'Faculty', department = 'Computer Science & Engineering', token = null) =>
    api.post('/auth/google-login', { email, full_name: fullName, role, department, token }),
  requestPasswordReset: (email) => api.post('/auth/request-password-reset', { email }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, new_password: newPassword }),
  register: (userData) => api.post('/auth/register', userData),
  createUser: (userData) => api.post('/auth/users/create', userData),
  getMe: () => api.get('/auth/me'),
  listUsers: () => api.get('/auth/users'),
  getUsers: () => api.get('/auth/users'),
  updateUserRole: (userId, role, isActive = true) => api.post('/auth/users/update-role', { user_id: userId, role, is_active: isActive }),
};

export const documentAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 300000 // 5 minutes timeout for document upload & processing initiation
  }),
  list: (subCriterion = 'All', validationStatus = 'All') => api.get(`/documents?sub_criterion=${subCriterion}&validation_status=${validationStatus}`),
  getAll: (subCriterion = 'All', validationStatus = 'All') => api.get(`/documents?sub_criterion=${subCriterion}&validation_status=${validationStatus}`),
  getStatus: (id) => api.get(`/documents/${id}/status`),
  retryProcessing: (id) => api.post(`/documents/${id}/retry`),
  getValidationSummary: (id) => api.get(`/documents/${id}/validation-summary`),
  validateHod: (id) => api.post(`/documents/${id}/validate-hod`),
  rejectHod: (id, rejection_reason) => api.post(`/documents/${id}/reject-hod`, { rejection_reason }),
  requestRevisionHod: (id, rejection_reason) => api.post(`/documents/${id}/request-revision-hod`, { rejection_reason }),
  validatePrincipal: (id) => api.post(`/documents/${id}/validate-principal`),
  rejectPrincipal: (id, rejection_reason) => api.post(`/documents/${id}/reject-principal`, { rejection_reason }),
  requestRevisionPrincipal: (id, rejection_reason) => api.post(`/documents/${id}/request-revision-principal`, { rejection_reason }),
  delete: (id) => api.delete(`/documents/${id}`),
  searchRag: (query, subCriterion = 'All', docId = null) => api.post('/documents/rag-query', { query, sub_criterion: subCriterion, doc_id: docId }),
  ragQuery: (query, subCriterion = 'All', docId = null) => api.post('/documents/rag-query', { query, sub_criterion: subCriterion, doc_id: docId }),
};

export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAllRead: () => api.post('/notifications/mark-read'),
};

export const inboxAPI = {
  getInbox: () => api.get('/inbox'),
  markRead: (id) => api.patch(`/inbox/${id}/read`),
  sendMessage: (payload) => api.post('/inbox/send', payload),
};

export const searchAPI = {
  globalSearch: (q) => api.get(`/search/global?q=${encodeURIComponent(q)}`),
};

export const adminAPI = {
  getConfig: () => api.get('/admin/config'),
  updateConfig: (config) => api.patch('/admin/config', config),
  reindexRag: () => api.post('/admin/reindex-rag'),
  clearCache: () => api.post('/admin/clear-cache'),
  certify100Percent: () => api.post('/admin/certify-100-percent'),
};

export const complianceAPI = {
  certify100Percent: () => api.post('/admin/certify-100-percent'),
};

export const criterionAPI = {
  getAnalyses: () => api.get('/criterion/analyses'),
  getSubDetail: (code) => api.get(`/criterion/sub-criterion/${code}`),
  getGaps: (subCriterion = 'All') => api.get(`/criterion/gaps?sub_criterion=${subCriterion}`),
  updateGapStatus: (gapId, status) => api.patch(`/criterion/gaps/${gapId}/status`, { status }),
  getRecommendations: (subCriterion = 'All') => api.get(`/criterion/recommendations?sub_criterion=${subCriterion}`),
  getEvidence: (subCriterion = 'All') => api.get(`/metrics/matrix?sub_criterion=${subCriterion}`),
  getEvidenceMatrix: (subCriterion = 'All') => api.get(`/metrics/matrix?sub_criterion=${subCriterion}`),
  reanalyze: () => api.post('/criterion/reanalyze'),
};

export const analyticsAPI = {
  getOverview: (docId = null) => api.get(docId && docId !== 'all' && docId !== 'All' ? `/analytics/overview?document_id=${docId}` : '/analytics/overview'),
  getPriorityActions: () => api.get('/analytics/priority-actions'),
  getFixFirst: () => api.get('/analytics/fix-first'),
  getTrustCenter: () => api.get('/analytics/trust-center'),
  getDataLineage: (metricId) => api.get(`/analytics/data-lineage/${metricId}`),
  getShapExplanation: (subCriterion) => api.get(`/analytics/shap-explanation/${subCriterion}`),
  getAuditTrail: () => api.get('/analytics/audit-trail'),
  getQualityGate: () => api.get('/criterion/quality-gate'),
};

export const metricsAPI = {
  getEvidenceMatrix: (subCriterion = 'All') => api.get(`/metrics/matrix?sub_criterion=${subCriterion}`),
  getMetricDetail: (metricId) => api.get(`/metrics/${metricId}`),
  findMissingEvidence: () => api.post('/metrics/missing-evidence'),
  overrideMetricStatus: (metricId, newStatus, overrideReason) => 
    api.post(`/metrics/${metricId}/override`, { new_status: newStatus, override_reason: overrideReason }),
};

export const reportAPI = {
  downloadPdf: (institutionName, documentId = null) => {
    let url = `/reports/download-pdf?institution=${encodeURIComponent(institutionName)}`;
    if (documentId) {
      url += `&document_id=${documentId}`;
    }
    return api.get(url, {
      responseType: 'blob'
    });
  },
  downloadCsv: (institutionName, documentId = null) => {
    let url = `/reports/download-csv?institution=${encodeURIComponent(institutionName)}`;
    if (documentId) {
      url += `&document_id=${documentId}`;
    }
    return api.get(url, {
      responseType: 'blob'
    });
  }
};

export const reportsAPI = reportAPI;


export default api;
