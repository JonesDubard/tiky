// scripts/test-login-api.ts
async function testLogin() {
  console.log("🔍 Testing login API...")
  
  const response = await fetch("http://localhost:3000/api/auth/csrf")
  const csrf = await response.json()
  console.log("CSRF token:", csrf.csrfToken)
  
  const loginResponse = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "admin@tikky.com",
      password: "admin123",
      csrfToken: csrf.csrfToken,
      redirect: false,
      json: true,
    }),
  })
  
  const result = await loginResponse.json()
  console.log("Login result:", JSON.stringify(result, null, 2))
}

testLogin().catch(console.error)
