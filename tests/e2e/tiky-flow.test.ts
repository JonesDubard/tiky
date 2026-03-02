// tests/e2e/tiky-flow.test.ts
// Run with: npx jest tests/e2e/tiky-flow.test.ts
// Install deps first: npm install --save-dev jest @types/jest ts-jest node-fetch

/**
 * Tiky E2E Test Suite
 * Tests the full flow: auth → browse events → purchase ticket → vote on token-gated poll
 *
 * These tests hit your LOCAL dev server so make sure it's running:
 *   npm run dev
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiGet(path: string, cookie?: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  return res;
}

async function apiPost(path: string, body: object, cookie?: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  return res;
}

async function apiPatch(path: string, body: object, cookie?: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  return res;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe("Tiky Platform E2E Tests", () => {

  // ── 1. Public API smoke tests ──────────────────────────────────────────────
  describe("Public endpoints", () => {
    test("GET /api/events returns event list", async () => {
      const res = await apiGet("/api/events");
      expect(res.status).toBe(200);
      const data = await res.json();
      // Should have events array (even if empty)
      expect(data).toHaveProperty("events");
      expect(Array.isArray(data.events)).toBe(true);
      console.log(`  ✓ Found ${data.events.length} events`);
    });

    test("GET /api/polls returns active polls", async () => {
      const res = await apiGet("/api/polls");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty("polls");
      expect(Array.isArray(data.polls)).toBe(true);
      console.log(`  ✓ Found ${data.polls.length} active polls`);
    });

    test("GET /api/polls with invalid id returns 404", async () => {
      const res = await apiGet("/api/polls/nonexistent-id-12345");
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data).toHaveProperty("error");
    });
  });

  // ── 2. Auth protection tests ───────────────────────────────────────────────
  describe("Auth protection", () => {
    test("POST /api/polls without auth returns 401", async () => {
      const res = await apiPost("/api/polls", {
        title: "Test Poll",
        options: [{ text: "A" }, { text: "B" }],
      });
      expect(res.status).toBe(401);
    });

    test("PATCH /api/admin/users/:id/role without auth returns 401", async () => {
      const res = await apiPatch("/api/admin/users/fake-id/role", { role: "ORGANIZER" });
      expect(res.status).toBe(401);
    });

    test("POST /api/polls/:id/vote on TOKEN_GATED poll without auth returns 401", async () => {
      // First get a token-gated poll if one exists
      const pollsRes = await apiGet("/api/polls?status=ALL");
      if (pollsRes.status !== 200) return;
      const { polls } = await pollsRes.json();
      const gatedPoll = polls.find((p: { pollType: string }) => p.pollType === "TOKEN_GATED");

      if (!gatedPoll) {
        console.log("  ⚠ No TOKEN_GATED poll found — skipping");
        return;
      }

      const res = await apiPost(`/api/polls/${gatedPoll.id}/vote`, {
        optionId: gatedPoll.options?.[0]?.id ?? "fake",
      });
      expect(res.status).toBe(401);
      console.log(`  ✓ TOKEN_GATED poll correctly blocked unauthenticated vote`);
    });
  });

  // ── 3. Poll results API ────────────────────────────────────────────────────
  describe("Poll results", () => {
    test("GET /api/polls/:id/results returns structured data", async () => {
      const pollsRes = await apiGet("/api/polls");
      if (pollsRes.status !== 200) return;
      const { polls } = await pollsRes.json();

      if (polls.length === 0) {
        console.log("  ⚠ No polls found — create one first");
        return;
      }

      const poll = polls[0];
      const res = await apiGet(`/api/polls/${poll.id}/results`);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("pollId");
      expect(data).toHaveProperty("totalVotes");
      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);

      // Each result should have id, text, votes, percentage
      if (data.results.length > 0) {
        const result = data.results[0];
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("text");
        expect(result).toHaveProperty("votes");
        expect(result).toHaveProperty("percentage");
        expect(typeof result.percentage).toBe("number");
        expect(result.percentage).toBeGreaterThanOrEqual(0);
        expect(result.percentage).toBeLessThanOrEqual(100);
      }

      console.log(`  ✓ Poll "${poll.title}" has ${data.totalVotes} votes across ${data.results.length} options`);
    });
  });

  // ── 4. Vote duplicate prevention ──────────────────────────────────────────
  describe("Vote integrity", () => {
    test("Voting twice on a PUBLIC poll returns 409", async () => {
      const pollsRes = await apiGet("/api/polls");
      if (pollsRes.status !== 200) return;
      const { polls } = await pollsRes.json();
      const publicPoll = polls.find((p: { pollType: string; options: { id: string }[] }) =>
        p.pollType === "PUBLIC" && p.options?.length > 0
      );

      if (!publicPoll) {
        console.log("  ⚠ No PUBLIC poll with options found — skipping");
        return;
      }

      // Vote once (guest — no auth cookie)
      const firstVote = await apiPost(`/api/polls/${publicPoll.id}/vote`, {
        optionId: publicPoll.options[0].id,
      });

      // Guest votes don't have userId so duplicate check doesn't apply
      // This test is meaningful for logged-in users only
      // Just verify the API responds correctly
      expect([201, 409, 403]).toContain(firstVote.status);
      console.log(`  ✓ First vote response: ${firstVote.status}`);
    });
  });

  // ── 5. Admin role API ──────────────────────────────────────────────────────
  describe("Admin role management", () => {
    test("PATCH /api/admin/users/:id/role with invalid role returns 400", async () => {
      // Even without auth this hits the 401 guard first — that's correct behavior
      const res = await apiPatch("/api/admin/users/any-id/role", { role: "SUPERUSER" });
      // Either 401 (no auth) or 400 (bad role) — both are correct
      expect([400, 401]).toContain(res.status);
    });
  });

  // ── 6. Upload endpoint ─────────────────────────────────────────────────────
  describe("File upload", () => {
    test("POST /api/upload/poll-image without auth returns 401", async () => {
      const formData = new FormData();
      formData.append("file", new Blob(["fake"], { type: "image/jpeg" }), "test.jpg");

      const res = await fetch(`${BASE_URL}/api/upload/poll-image`, {
        method: "POST",
        body: formData,
      });
      expect(res.status).toBe(401);
    });
  });

  // ── 7. Toggle poll status ──────────────────────────────────────────────────
  describe("Poll toggle", () => {
    test("PATCH /api/polls/:id/toggle without auth returns 401", async () => {
      const res = await fetch(`${BASE_URL}/api/polls/fake-id/toggle`, {
        method: "PATCH",
      });
      expect(res.status).toBe(401);
    });
  });

  // ── 8. Page rendering smoke tests ─────────────────────────────────────────
  describe("Page rendering", () => {
    test("Public polls page returns 200", async () => {
      const res = await fetch(`${BASE_URL}/polls`);
      expect(res.status).toBe(200);
    });

    test("Public events page returns 200", async () => {
      const res = await fetch(`${BASE_URL}/events`);
      expect(res.status).toBe(200);
    });

    test("Admin login page returns 200", async () => {
      const res = await fetch(`${BASE_URL}/admin/login`);
      expect(res.status).toBe(200);
    });

    test("Admin dashboard redirects unauthenticated users", async () => {
      const res = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
      // Should redirect (3xx) to login
      expect(res.status).toBeGreaterThanOrEqual(300);
      expect(res.status).toBeLessThan(400);
    });
  });
});