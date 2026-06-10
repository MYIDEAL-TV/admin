export const secureFetch = async (url, options = {}) => {
  const token = localStorage.getItem("admin_token");

  const defaultHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });

  if (response.status === 401) {
    localStorage.removeItem("admin_token");
    window.location.href = "/admin/login?message=session_expired";
    return null;
  }
  return response;
};
