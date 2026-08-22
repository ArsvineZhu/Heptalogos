export function parseRecoveryMaintenanceProcessArgs(argv) {
  const [anchorRoot, role, ...args] = argv;
  if (!anchorRoot || !role) {
    throw new Error(
      "usage: recovery-maintenance-process.mjs <anchor> <role> [pg-bin] [port] [operation-id] [target-stage]",
    );
  }

  if (role === "maintenance") {
    const [pgBin, portText, targetStage, ...extra] = args;
    if (!pgBin || !portText || !targetStage || extra.length > 0) {
      throw new Error(
        "maintenance usage: <anchor> maintenance <pg-bin> <port> <target-stage>",
      );
    }
    return { anchorRoot, role, pgBin, portText, targetStage };
  }

  if (role === "recovery") {
    const [pgBin, portText, operationIdText, targetStage, ...extra] = args;
    if (!pgBin || !portText || !operationIdText || !targetStage || extra.length > 0) {
      throw new Error(
        "recovery usage: <anchor> recovery <pg-bin> <port> <operation-id> <target-stage>",
      );
    }
    return { anchorRoot, role, pgBin, portText, operationIdText, targetStage };
  }

  if (role === "recovery-complete") {
    const [pgBin, portText, operationIdText, ...extra] = args;
    if (!pgBin || !portText || !operationIdText || extra.length > 0) {
      throw new Error(
        "recovery-complete usage: <anchor> recovery-complete <pg-bin> <port> <operation-id>",
      );
    }
    return { anchorRoot, role, pgBin, portText, operationIdText };
  }

  throw new Error(`unsupported role ${role}`);
}
