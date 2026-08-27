import type { BootstrapAdminClient } from "./bootstrap-admin.js";
import type { BootstrapMutationAuthority } from "./bootstrap-authority.js";

export async function queryWithAuthority<Row = never>(
  client: BootstrapAdminClient,
  authority: BootstrapMutationAuthority,
  text: string,
  values?: readonly unknown[],
): Promise<{ readonly rows: readonly Row[] }> {
  authority.assertCurrent();
  const result = await client.query<Row>(text, values);
  authority.assertCurrent();
  return result;
}
