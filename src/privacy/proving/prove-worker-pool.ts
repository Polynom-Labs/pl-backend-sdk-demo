import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { fork, type ChildProcess } from "node:child_process";
import { join } from "node:path";
import { loadDemoEnv } from "../../config/env";
import { ResourcePool } from "../../lib/async";
import type {
  PrivacyWorkerJob,
  PrivacyWorkerRequest,
  PrivacyWorkerResponse,
  PrivacyWorkerResult,
  PrivacyWorkerSuccess,
} from "../jobs";

type WorkerSlot = {
  worker: ChildProcess;
  pending: Map<
    string,
    {
      resolve: (result: PrivacyWorkerResult) => void;
      reject: (error: Error) => void;
    }
  >;
};

@Injectable()
export class ProveWorkerPool implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ProveWorkerPool.name);
  private readonly env = loadDemoEnv();
  private pool: ResourcePool<WorkerSlot> | undefined;
  private readonly workers: ChildProcess[] = [];
  private ready = false;

  size(): number {
    return this.env.proveWorkers;
  }

  isReady(): boolean {
    return this.ready;
  }

  async onModuleInit(): Promise<void> {
    const slots = await Promise.all(
      Array.from({ length: this.env.proveWorkers }, (_, index) =>
        this.spawnWorker(index),
      ),
    );
    this.pool = new ResourcePool(slots);
    this.ready = true;
    this.logger.log(`Prove worker pool ready (${slots.length} WASM isolates)`);
  }

  async onModuleDestroy(): Promise<void> {
    this.ready = false;
    await Promise.all(
      this.workers.map(
        (worker) =>
          new Promise<void>((resolve) => {
            worker.once("exit", () => {
              resolve();
            });
            worker.kill();
          }),
      ),
    );
  }

  async run(job: PrivacyWorkerJob): Promise<PrivacyWorkerSuccess> {
    if (!this.pool || !this.ready) {
      throw new Error("Prove worker pool is not ready.");
    }
    const result = await this.pool.run((slot) => this.dispatch(slot, job));
    if (!result.ok) {
      throw Object.assign(new Error(result.error), {
        ...(result.kytUnauthenticated ? { kytUnauthenticated: true } : {}),
      });
    }
    return result;
  }

  private dispatch(
    slot: WorkerSlot,
    job: PrivacyWorkerJob,
  ): Promise<PrivacyWorkerResult> {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      slot.pending.set(id, { resolve, reject });
      const request: PrivacyWorkerRequest = { id, job };
      const sent = slot.worker.send(request);
      if (sent) {
        return;
      }
      slot.pending.delete(id);
      reject(new Error("Prove worker IPC channel is closed."));
    });
  }

  private async spawnWorker(index: number): Promise<WorkerSlot> {
    const worker = fork(join(__dirname, "prove-worker.js"), [], {
      execArgv: [],
      stdio: ["inherit", "inherit", "inherit", "ipc"],
    });
    this.workers.push(worker);
    await waitForReady(worker);
    const slot: WorkerSlot = { worker, pending: new Map() };
    worker.on("message", (message: PrivacyWorkerResponse) => {
      if (message.type === "ready") {
        return;
      }
      const pending = slot.pending.get(message.id);
      if (!pending) {
        return;
      }
      slot.pending.delete(message.id);
      pending.resolve(message.result);
    });
    worker.on("error", (error) => {
      this.failPending(slot, error);
    });
    worker.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        this.failPending(
          slot,
          new Error(
            `Prove worker ${index.toString()} exited with code ${code.toString()}`,
          ),
        );
      }
    });
    this.logger.log(`Prove worker ${index.toString()} ready`);
    return slot;
  }

  private failPending(slot: WorkerSlot, error: Error): void {
    for (const pending of slot.pending.values()) {
      pending.reject(error);
    }
    slot.pending.clear();
  }
}

function waitForReady(worker: ChildProcess): Promise<void> {
  return new Promise((resolve, reject) => {
    const onMessage = (message: PrivacyWorkerResponse) => {
      if (message.type !== "ready") {
        return;
      }
      cleanup();
      resolve();
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const onExit = (code: number | null) => {
      cleanup();
      reject(
        new Error(`Prove worker exited before ready with code ${String(code)}`),
      );
    };
    const cleanup = () => {
      worker.off("message", onMessage);
      worker.off("error", onError);
      worker.off("exit", onExit);
    };
    worker.on("message", onMessage);
    worker.on("error", onError);
    worker.on("exit", onExit);
  });
}
