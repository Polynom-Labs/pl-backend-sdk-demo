export type PrivacyWorkerJob =
  | { kind: "register"; publicKey: string }
  | { kind: "deposit"; publicKey: string; amountStroops: string }
  | {
      kind: "transfer";
      senderPublicKey: string;
      recipientPublicKey: string;
      amountStroops: string;
    }
  | { kind: "withdraw"; publicKey: string; amountStroops: string };

export type PrivacyWorkerSuccess = {
  ok: true;
  kind: PrivacyWorkerJob["kind"];
  txId?: string;
  privateAddress?: string;
  fromAddress?: string;
  toAddress?: string;
  amountStroops?: string;
};

export type PrivacyWorkerFailure = {
  ok: false;
  error: string;
  kytUnauthenticated?: boolean;
};

export type PrivacyWorkerResult = PrivacyWorkerSuccess | PrivacyWorkerFailure;

export type PrivacyWorkerRequest = {
  id: string;
  job: PrivacyWorkerJob;
};

export type PrivacyWorkerResponse =
  | { type: "ready" }
  | { type: "result"; id: string; result: PrivacyWorkerResult };
