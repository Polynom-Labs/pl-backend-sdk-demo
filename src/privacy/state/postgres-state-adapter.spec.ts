import {
  createPostgresStateAdapter,
  persistSnapshot,
  loadAccountStateTree,
} from "./postgres-state-adapter";
import type { InMemoryStateAdapter } from "@arcanetech/privacy-sdk-state-memory";

type FakeRepo = {
  saved: Map<string, Record<string, unknown>>;
  findOneBy: (query: {
    id: string;
  }) => Promise<{ id: string; tree: Record<string, unknown> } | null>;
  save: (row: {
    id: string;
    tree: Record<string, unknown>;
  }) => Promise<unknown>;
};

function fakeRepo(initial?: Record<string, unknown>): FakeRepo {
  const saved = new Map<string, Record<string, unknown>>();
  if (initial) {
    saved.set("default", initial);
  }
  const repo: FakeRepo = {
    saved,
    async findOneBy(query) {
      const tree = repo.saved.get(query.id);
      return tree ? { id: query.id, tree } : null;
    },
    async save(row) {
      repo.saved.set(row.id, row.tree);
      return row;
    },
  };
  return repo;
}

function fakeMemory(tree: Record<string, unknown>): InMemoryStateAdapter {
  let state = tree;
  return {
    getState: () => state,
    resetState(nextState = {}) {
      state = nextState;
    },
    registerDefinition() {
      return undefined;
    },
    async write() {
      return undefined;
    },
    async read<TResult>(): Promise<TResult> {
      return undefined as TResult;
    },
  };
}

describe("postgres state adapter wrapper", () => {
  it("hydrates from JSONB and persists after write", async () => {
    const repo = fakeRepo({ hello: "world" });
    const memory = fakeMemory(repo.saved.get("default") ?? {});
    expect(memory.getState()).toEqual({ hello: "world" });
    const adapter = createPostgresStateAdapter(
      repo as never,
      memory,
      "default",
    );
    await adapter.write({ type: "test", operations: [] } as never);
    expect(repo.saved.get("default")).toEqual({ hello: "world" });
    memory.resetState({ hello: "next", amount: 1n });
    await persistSnapshot(repo as never, memory, "account:GTEST");
    expect(repo.saved.get("account:GTEST")).toEqual({
      hello: "next",
      amount: "1",
    });
  });

  it("partitions the legacy default snapshot when an account row is missing", async () => {
    const repo = fakeRepo({
      privateRecords: [
        { id: "1", owner: "GA" },
        { id: "2", owner: "GB" },
      ],
    });
    const tree = await loadAccountStateTree(repo as never, "GA");
    expect(tree.privateRecords).toEqual([{ id: "1", owner: "GA" }]);
  });
});
