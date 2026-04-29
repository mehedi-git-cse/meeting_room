/**
 * Integration tests for the auth and health endpoints.
 * Requires a running PostgreSQL instance and a populated .env file.
 * Run: npm test
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../src/app.js";
import { prisma } from "../src/config/db.js";

const seed = `test_${Date.now()}`;
const TEST_USER = {
  email: `${seed}@test.com`,
  username: `user_${seed.slice(-8)}`,
  password: "StrongPass@123"
};

let accessToken = "";
let refreshToken = "";

describe("health endpoint", () => {
  it("GET /api/health → 200", async () => {
    const res = await request(app).get("/api/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.status, "ok");
  });
});

describe("auth flow", () => {
  before(async () => {
    await prisma.$connect();
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
    await prisma.$disconnect();
  });

  it("POST /api/auth/register → 201 with tokens", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    assert.equal(res.status, 201);
    assert.ok(res.body.accessToken, "should return access token");
    assert.ok(res.body.refreshToken, "should return refresh token");
    assert.equal(res.body.user.email, TEST_USER.email);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("POST /api/auth/register duplicate → 409", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    assert.equal(res.status, 409);
  });

  it("POST /api/auth/login → 200 with tokens", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.accessToken);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("POST /api/auth/login bad password → 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_USER.email,
      password: "WrongPassword1"
    });
    assert.equal(res.status, 401);
  });

  it("GET /api/users/me with valid token → 200", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.email, TEST_USER.email);
  });

  it("GET /api/users/me without token → 401", async () => {
    const res = await request(app).get("/api/users/me");
    assert.equal(res.status, 401);
  });

  it("POST /api/auth/refresh → 200 with new tokens", async () => {
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken });
    assert.equal(res.status, 200);
    assert.ok(res.body.accessToken);
    assert.ok(res.body.refreshToken);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it("POST /api/auth/logout → 204", async () => {
    const res = await request(app).post("/api/auth/logout").send({ refreshToken });
    assert.equal(res.status, 204);
  });
});

describe("servers endpoint", () => {
  let token = "";

  before(async () => {
    await prisma.$connect();
    const reg = await request(app).post("/api/auth/register").send({
      email: `srv_${seed}@test.com`,
      username: `srv_${seed.slice(-7)}`,
      password: TEST_USER.password
    });
    token = reg.body.accessToken;
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: `srv_${seed}@test.com` } });
    await prisma.$disconnect();
  });

  it("POST /api/servers → 201 creates server", async () => {
    const res = await request(app)
      .post("/api/servers")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Test Server" });
    assert.equal(res.status, 201);
    assert.equal(res.body.name, "Test Server");
    assert.ok(res.body.id);
  });

  it("GET /api/servers → 200 lists servers", async () => {
    const res = await request(app)
      .get("/api/servers")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });
});

describe("rtc config endpoint", () => {
  let token = "";

  before(async () => {
    await prisma.$connect();
    const reg = await request(app).post("/api/auth/register").send({
      email: `rtc_${seed}@test.com`,
      username: `rtc_${seed.slice(-7)}`,
      password: TEST_USER.password
    });
    token = reg.body.accessToken;
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: `rtc_${seed}@test.com` } });
    await prisma.$disconnect();
  });

  it("GET /api/rtc/config → 200 returns iceServers array", async () => {
    const res = await request(app)
      .get("/api/rtc/config")
      .set("Authorization", `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.iceServers));
  });
});
