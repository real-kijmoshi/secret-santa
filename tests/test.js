const fetch = require('node-fetch');
require('dotenv').config();

const { TestRunner } = require('./runner');

const runner = new TestRunner();

runner
.it("should return a token when logging in", async () => {
    const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: process.env.TEST_USERNAME,
            password: process.env.TEST_PASSWORD
        })
    });
    
    const data = await response.json();
    runner.tmp.token = data.token;
    return data.token;
}, "string", "type")

.it("should return a 400-404 status code when logging in with invalid credentials", async () => {
    const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: "invalid",
            password: "invalid"
        })
    });
    return response.status;
}, [400, 404], "between")

.it("should return a 400 status code when logging in with missing credentials", async () => {
    const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    });

    return response.status;
}, 400, "equal")

.it("shouldn't allow access to protected routes without a token", async () => {
    const response = await fetch("http://localhost:3000/protected");
    return response.status;
}, 401, "equal")

.it("should allow access to protected routes with a token", async () => {
    const response = await fetch("http://localhost:3000/protected", {
        headers: {
            Authorization: `Bearer ${runner.tmp.token}`
        }
    });
    return response.status;
}, 200, "equal");

// Run tests
(async () => {
    await runner.runTests();
})();