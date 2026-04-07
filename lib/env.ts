export const appEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Textile ERP",
  loginUrl: process.env.NEXT_PUBLIC_ERPNEXT_LOGIN_URL || "http://127.0.0.1:8000/login",
  erpBaseUrl: process.env.ERPNEXT_BASE_URL || "http://127.0.0.1:8000"
};
