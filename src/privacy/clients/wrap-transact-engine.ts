import type {
  PrivacyPoolService,
  StellarPreparedOperation,
  StellarTransactEngine,
  StellarTransactEnvironment,
} from '@arcanetech/privacy-sdk-stellar';

export function wrapTransactEngineToProveAtPrepare(input: {
  engine: StellarTransactEngine;
  environment: StellarTransactEnvironment;
  poolService: PrivacyPoolService;
  finalizeSpendOperationAtExecute: (
    prepared: StellarPreparedOperation,
    environment: StellarTransactEnvironment,
    poolService: PrivacyPoolService,
  ) => Promise<StellarPreparedOperation>;
}): StellarTransactEngine {
  return {
    prepare: async (prepared: StellarPreparedOperation) => {
      const afterPrepare = await input.engine.prepare(prepared);
      if (afterPrepare.transactArtifacts?.proofHex) {
        return afterPrepare;
      }
      return input.finalizeSpendOperationAtExecute(
        afterPrepare,
        input.environment,
        input.poolService,
      );
    },
    submit: (prepared, signedPayload) => input.engine.submit(prepared, signedPayload),
  };
}
