import { test } from "node:test";
import assert from "node:assert/strict";
import { createPlugin } from "../src/plugin.ts";

function fixture(legacy?: { id: string; slug: string }) {
  let value: unknown = undefined;
  let revision = 0;
  const settings = {
    async get(key: string) { return key === "selected" ? legacy : value; },
    async getVersioned() { return revision ? { value: structuredClone(value), revision: String(revision) } : null; },
    async compareAndSet(_key: string, expected: string | null, next: unknown) {
      if (expected !== (revision ? String(revision) : null)) return { applied: false };
      value = structuredClone(next); revision++; return { applied: true, revision: String(revision) };
    },
  };
  const plugin = createPlugin();
  const run = (route: "selection" | "settings", input: object) => plugin.routes[route].handler({
    input, settings, content: { get: async (_collection: string, id: string) => id === "draft" ? { id, slug: id, status: "draft" } : { id, slug: id, status: "published" } },
  } as never);
  return { run };
}

test("legacy single selection and default limit survive upgrade", async () => {
  const { run } = fixture({ id: "old", slug: "old" });
  assert.deepEqual(await run("selection", { action: "get" }), { limit: 1, selected: [{ id: "old", slug: "old" }] });
  await assert.rejects(run("selection", { action: "select", id: "new" }), /limit reached/);
  const updated = await run("settings", { action: "save", limit: 3 });
  assert.equal(updated.selected[0].id, "old");
  assert.equal(updated.limit, 3);
});

test("limit, removal and invalid inputs preserve selections", async () => {
  const { run } = fixture();
  await run("settings", { action: "save", limit: 2 });
  await run("selection", { action: "select", id: "one" });
  await run("selection", { action: "select", id: "two" });
  await assert.rejects(run("selection", { action: "select", id: "three" }), /limit reached/);
  await assert.rejects(run("settings", { action: "save", limit: 1 }), /Remove excess posts/);
  await assert.rejects(run("selection", { action: "select", id: "draft" }), /Publish/);
  await assert.rejects(run("settings", { action: "save", limit: 0 }), /whole number/);
  const after = await run("selection", { action: "clear", id: "one" });
  assert.deepEqual(after.selected.map((post) => post.id), ["two"]);
  assert.equal((await run("settings", { action: "save", limit: 1 })).limit, 1);
});

test("simultaneous selections cannot exceed limit", async () => {
  const { run } = fixture();
  const results = await Promise.allSettled([run("selection", { action: "select", id: "one" }), run("selection", { action: "select", id: "two" })]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal((await run("selection", { action: "get" })).selected.length, 1);
});
