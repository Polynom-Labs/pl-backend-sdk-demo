export function maxSimulatorConcurrency(
  registeredCount: number,
  proveWorkers: number,
): number {
  return Math.max(1, Math.min(proveWorkers, Math.floor(registeredCount / 2)));
}

export function pickDisjointTransferPair<T>(input: {
  funded: T[];
  registered: T[];
  busy: ReadonlySet<string>;
  key: (account: T) => string;
}): { sender: T; recipient: T } | undefined {
  const senders = input.funded.filter(
    (account) => !input.busy.has(input.key(account)),
  );
  if (senders.length === 0) {
    return undefined;
  }
  const sender = senders[Math.floor(Math.random() * senders.length)]!;
  const senderKey = input.key(sender);
  const recipients = input.registered.filter((account) => {
    const key = input.key(account);
    return key !== senderKey && !input.busy.has(key);
  });
  if (recipients.length === 0) {
    return undefined;
  }
  const recipient = recipients[Math.floor(Math.random() * recipients.length)]!;
  return { sender, recipient };
}
