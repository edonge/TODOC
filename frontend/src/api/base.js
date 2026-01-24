const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:8000';

export const apiBaseUrl = API_BASE_URL;

export const withApiBase = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

export const apiFetch = async (path, options = {}, config = {}) => {
  const response = await fetch(withApiBase(path), options);
  if (response.status === 401 && !config.skipAuthRedirect) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
    window.location.href = '/login';
  }
  return response;
};
