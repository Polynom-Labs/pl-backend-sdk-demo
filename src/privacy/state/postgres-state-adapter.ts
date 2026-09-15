import type {
  StateBridgeAdapter,
  StateBridgeCall,
  StateBridgeDefinition,
} from "@arcanetech/privacy-sdk-core/state";
import type { InMemoryStateAdapter } from "@arcanetech/privacy-sdk-state-memory";
import type { Repository } from "typeorm";
import { SdkStateRow } from "../../persistence/sdk-state.entity";
import { importEsm } from "../../lib/esm";
import {
  accountSnapshotId,
  LEGACY_SNAPSHOT_ID,
  partitionSdkStateTree,
} from "./sdk-state-snapshot";

function jsonSafeClone(
  value: Record<string, unknown>,
): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(value, (_key, current: unknown) =>
      typeof current === "bigint" ? current.toString() : current,
    ),
  ) as Record<string, unknown>;
}

export function createPostgresStateAdapter(
  repository: Repository<SdkStateRow>,
  memory: InMemoryStateAdapter,
  snapshotId: string,
): StateBridgeAdapter {
  return {
    registerDefinition(definition: StateBridgeDefinition) {
      memory.registerDefinition(definition);
    },
    async write(call: StateBridgeCall) {
      await memory.write(call);
      await persistSnapshot(repository, memory, snapshotId);
    },
    async read<TResult>(call: StateBridgeCall): Promise<TResult> {
      return memory.read(call);
    },
  };
}

export async function loadAccountStateTree(
  repository: Repository<SdkStateRow>,
  publicKey: string,
): Promise<Record<string, unknown>> {
  const row = await repository.findOneBy({ id: accountSnapshotId(publicKey) });
  if (row?.tree) {
    return row.tree;
  }
  const legacy = await repository.findOneBy({ id: LEGACY_SNAPSHOT_ID });
  if (legacy?.tree) {
    return partitionSdkStateTree(legacy.tree, publicKey);
  }
  return {};
}

export async function hydrateMemoryAdapter(
  repository: Repository<SdkStateRow>,
  publicKey: string,
): Promise<InMemoryStateAdapter> {
  const { createInMemoryStateAdapter } = await importEsm<
    typeof import("@arcanetech/privacy-sdk-state-memory")
  >("@arcanetech/privacy-sdk-state-memory");
  return createInMemoryStateAdapter(
    await loadAccountStateTree(repository, publicKey),
  );
}

export async function persistSnapshot(
  repository: Repository<SdkStateRow>,
  memory: InMemoryStateAdapter,
  snapshotId: string,
): Promise<void> {
  await repository.save({
    id: snapshotId,
    tree: jsonSafeClone(memory.getState()),
  });
}
