import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { loadDemoEnv } from "../config/env";
import { deriveAccountKeypairs } from "./hd-wallet";
import { fundNativeViaFriendbot } from "./friendbot";
import { HdAccountEntity } from "../persistence/hd-account.entity";
import { PrivacyOperationsService } from "../privacy/operations";

@Injectable()
export class AccountsService {
  private readonly env = loadDemoEnv();

  constructor(
    @InjectRepository(HdAccountEntity)
    private readonly accounts: Repository<HdAccountEntity>,
    private readonly operations: PrivacyOperationsService,
  ) {}

  async setup(): Promise<HdAccountEntity[]> {
    const keypairs = deriveAccountKeypairs(
      this.env.mnemonic,
      this.env.accountCount,
    );
    const rows: HdAccountEntity[] = [];
    for (const [index, keypair] of keypairs.entries()) {
      let row = await this.accounts.findOneBy({ hdIndex: index });
      if (!row) {
        row = this.accounts.create({
          hdIndex: index,
          publicKey: keypair.publicKey(),
          privateAddress: null,
          funded: false,
          registered: false,
          sentCount: "0",
          sentVolumeStroops: "0",
        });
      }
      if (!row.funded) {
        await fundNativeViaFriendbot(
          keypair.publicKey(),
          this.env.friendbotUrl,
        );
        row.funded = true;
      }
      await this.accounts.save(row);
      if (!row.registered) {
        await this.operations.registerAccount(row);
      }
      const saved = await this.accounts.findOneByOrFail({ hdIndex: index });
      rows.push(saved);
    }
    return rows;
  }

  async list(): Promise<HdAccountEntity[]> {
    return this.accounts.find({ order: { hdIndex: "ASC" } });
  }

  async getByIndex(index: number): Promise<HdAccountEntity> {
    const row = await this.accounts.findOneBy({ hdIndex: index });
    if (!row) {
      throw new NotFoundException(
        `Account ${index} does not exist. Run setup first.`,
      );
    }
    return row;
  }
}
