export function saveToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function getToken() {
  return localStorage.getItem("admin_token");
}

export function removeToken() {
  localStorage.removeItem("admin_token");
}

export function isLoggedIn() {
  return !!localStorage.getItem("admin_token");
}