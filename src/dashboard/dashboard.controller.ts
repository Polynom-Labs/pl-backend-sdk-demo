import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { loadDemoEnv } from "../config/env";
import { stroopsToXlm, xlmToStroops } from "../lib/money";
import { AccountsService } from "../accounts/accounts.service";
import { PrivacyOperationsService } from "../privacy/operations";
import {
  SimulatorService,
  type SimulatorStartInput,
} from "../simulator/simulator.service";
import {
  OperationLogService,
  logPageCount,
  logPageSize,
  parsePositiveInt,
} from "../operation-log";
import { accountIndexForAddress } from "./dashboard-view";

@Controller("api")
export class DashboardController {
  private readonly env = loadDemoEnv();

  constructor(
    private readonly accounts: AccountsService,
    private readonly operations: PrivacyOperationsService,
    private readonly simulator: SimulatorService,
    private readonly logs: OperationLogService,
  ) {}

  @Get("state")
  async state(
    @Query("logPage") logPageRaw?: string,
    @Query("logLimit") logLimitRaw?: string,
  ) {
    const simulator = await this.simulator.getState();
    const accounts = await this.accounts.list();
    const pageSize = logPageSize(logLimitRaw);
    const { items, total, page } = await this.logs.page({
      page: parsePositiveInt(logPageRaw, 1),
      pageSize,
    });
    const accountViews = [];
    for (const account of accounts) {
      const balance = account.registered
        ? await this.operations.privateBalanceStroops(account.publicKey)
        : 0n;
      accountViews.push({
        index: account.hdIndex,
        publicKey: account.publicKey,
        privateAddress: account.privateAddress,
        funded: account.funded,
        registered: account.registered,
        privateBalanceXlm: stroopsToXlm(balance),
        sentCount: account.sentCount,
        sentVolumeXlm: stroopsToXlm(BigInt(account.sentVolumeStroops)),
      });
    }
    return {
      status: simulator.status,
      assetId: this.env.assetId,
      transactionCount: simulator.transactionCount,
      totalVolumeXlm: stroopsToXlm(BigInt(simulator.totalVolumeStroops)),
      accounts: accountViews,
      logs: {
        page,
        pageSize,
        total,
        pageCount: logPageCount(total, pageSize),
        items: items.map((entry) => ({
          at: entry.at.toISOString(),
          kind: entry.kind,
          message: entry.message,
          fromAddress: entry.fromAddress,
          toAddress: entry.toAddress,
          fromIndex: accountIndexForAddress(entry.fromAddress, accounts),
          toIndex: accountIndexForAddress(entry.toAddress, accounts),
          txId: entry.txId,
          error: entry.error,
        })),
      },
    };
  }

  @Post("setup")
  async setup() {
    const accounts = await this.accounts.setup();
    return { ok: true, count: accounts.length };
  }

  @Post("deposit")
  async deposit(@Body() body: { amountXlm?: number }) {
    const account = await this.accounts.getByIndex(0);
    const amount = xlmToStroops(body.amountXlm ?? 10);
    const txId = await this.operations.deposit(account, amount);
    return { ok: true, txId };
  }

  @Post("simulator/start")
  async start(@Body() body: SimulatorStartInput) {
    const row = await this.simulator.start(body);
    return { ok: true, status: row.status };
  }

  @Post("simulator/stop")
  async stop() {
    const row = await this.simulator.stop();
    return { ok: true, status: row.status };
  }

  @Post("withdraw")
  async withdraw(@Body() body: { accountIndex?: number; amountXlm?: number }) {
    const account = await this.accounts.getByIndex(body.accountIndex ?? 0);
    const amount = xlmToStroops(body.amountXlm ?? 1);
    const txId = await this.operations.withdraw(account, amount);
    return { ok: true, txId };
  }
}
