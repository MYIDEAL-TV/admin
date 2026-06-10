// src/services/mockAuth.js
export const mockLogin = async (email, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  if (email === "admin@idealtv.com" && password === "123456789") {
    return {
      success: true,
      token: "mock-jwt-token-8h", // Matches the 8h session requirement
      user: { email: "admin@idealtv.com", role: "admin" }
    };
  }
  
  throw new Error("Invalid email or password");
};