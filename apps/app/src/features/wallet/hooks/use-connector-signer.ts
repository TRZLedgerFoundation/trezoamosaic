'use client';

import { useKitTransactionSigner } from '@trezoa/connector';
import type { TransactionModifyingSigner } from '@trezoa/kit';

/**
 * Creates a transaction modifying signer from the Trezoa connector
 * Uses the connector's native kit-compatible transaction signer
 */
export function useConnectorSigner(): TransactionModifyingSigner<string> | null {
    const { signer } = useKitTransactionSigner();
    // Cast through unknown to bridge the generic signature difference between
    // @trezoa/connector's signer type and @trezoa/kit's TransactionModifyingSigner
    return signer as unknown as TransactionModifyingSigner<string> | null;
}
