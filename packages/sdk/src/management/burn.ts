import type { Address, Rpc, TrezoaRpcApi, TransactionSigner } from '@trezoa/kit';
import type { FullTransaction } from '../transaction-util';
import {
    createNoopSigner,
    pipe,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstructions,
} from '@trezoa/kit';
import { getBurnCheckedInstruction, TOKEN_2022_PROGRAM_ADDRESS } from '@trezoa-program/token-2022';
import { resolveTokenAccount, decimalAmountToRaw, getMintDetails } from '../transaction-util';

/**
 * Creates a transaction to burn tokens from the owner's token account.
 * This is a self-burn operation where the token owner burns their own tokens.
 *
 * @param rpc - The Trezoa RPC client instance
 * @param mint - The mint address
 * @param owner - The token owner's wallet address
 * @param decimalAmount - The decimal amount to burn (e.g., 1.5)
 * @param feePayer - The fee payer signer
 * @returns A promise that resolves to a FullTransaction object for burning tokens
 */
export const createBurnTransaction = async (
    rpc: Rpc<TrezoaRpcApi>,
    mint: Address,
    owner: Address | TransactionSigner<string>,
    decimalAmount: number,
    feePayer: Address | TransactionSigner<string>,
): Promise<FullTransaction> => {
    const feePayerSigner = typeof feePayer === 'string' ? createNoopSigner(feePayer) : feePayer;
    const ownerSigner = typeof owner === 'string' ? createNoopSigner(owner) : owner;
    const ownerAddress = typeof owner === 'string' ? owner : owner.address;

    // Get mint info to determine decimals
    const { decimals } = await getMintDetails(rpc, mint);

    // Convert decimal amount to raw amount
    const rawAmount = decimalAmountToRaw(decimalAmount, decimals);

    // Resolve owner's token account
    const { tokenAccount, isInitialized, balance } = await resolveTokenAccount(rpc, ownerAddress, mint);

    if (!isInitialized) {
        throw new Error('Token account does not exist for this mint');
    }

    if (balance < rawAmount) {
        throw new Error('Insufficient token balance for burn');
    }

    // Create burn instruction
    const burnInstruction = getBurnCheckedInstruction(
        {
            account: tokenAccount,
            mint,
            authority: ownerSigner,
            amount: rawAmount,
            decimals,
        },
        {
            programAddress: TOKEN_2022_PROGRAM_ADDRESS,
        },
    );

    // Get latest blockhash for transaction
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    return pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayer(feePayerSigner.address, m),
        m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        m => appendTransactionMessageInstructions([burnInstruction], m),
    ) as FullTransaction;
};
