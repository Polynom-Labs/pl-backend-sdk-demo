import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OperationLogEntity } from "../persistence/operation-log.entity";
import { clampLogPage } from "./paging";

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLogEntity)
    private readonly logs: Repository<OperationLogEntity>,
  ) {}

  async append(entry: {
    kind: string;
    message: string;
    fromAddress?: string;
    toAddress?: string;
    amountStroops?: string;
    txId?: string;
    error?: string;
  }): Promise<void> {
    await this.logs.save({
      at: new Date(),
      kind: entry.kind,
      message: entry.message,
      fromAddress: entry.fromAddress ?? null,
      toAddress: entry.toAddress ?? null,
      amountStroops: entry.amountStroops ?? null,
      txId: entry.txId ?? null,
      error: entry.error ?? null,
    });
  }

  async page(input: { page: number; pageSize: number }): Promise<{
    items: OperationLogEntity[];
    total: number;
    page: number;
  }> {
    const total = await this.logs.count();
    const page = clampLogPage(input.page, total, input.pageSize);
    const items = await this.logs.find({
      order: { at: "DESC" },
      skip: (page - 1) * input.pageSize,
      take: input.pageSize,
    });
    return { items, total, page };
  }
}
