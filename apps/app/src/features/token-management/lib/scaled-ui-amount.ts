import {
    createTrezoaRpc,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstructions,
    pipe,
    type Address,
    type Rpc,
    type TrezoaRpcApi,
    signTransactionMessageWithSigners,
    sendAndConfirmTransactionFactory,
    getSignatureFromTransaction,
    createTrezoaRpcSubscriptions,
    TransactionModifyingSigner,
    assertIsTransactionWithBlockhashLifetime,
} from '@trezoa/kit';
import { getUpdateMultiplierScaledUiMintInstruction } from '@trezoa-program/token-2022';
import { getRpcUrl, getWsUrl, getCommitment } from '@/lib/trezoa/rpc';
import { getMintDetails } from '@mosaic/sdk';

export interface UpdateScaledUiMultiplierOptions {
    mint: string;
    multiplier: number;
    rpcUrl?: string;
}

export interface UpdateScaledUiMultiplierResult {
    success: boolean;
    error?: string;
    transactionSignature?: string;
    multiplier?: number;
}

export const updateScaledUiMultiplier = async (
    options: UpdateScaledUiMultiplierOptions,
    signer: TransactionModifyingSigner,
): Promise<UpdateScaledUiMultiplierResult> => {
    try {
        if (!options.mint) throw new Error('Mint address is required');
        if (!Number.isFinite(options.multiplier) || options.multiplier <= 0) {
            throw new Error('Multiplier must be a positive number');
        }

        const rpcUrl = getRpcUrl(options.rpcUrl);
        const rpc: Rpc<TrezoaRpcApi> = createTrezoaRpc(rpcUrl);
        const rpcSubscriptions = createTrezoaRpcSubscriptions(getWsUrl(rpcUrl));

        // Get mint details for program address
        const { programAddress } = await getMintDetails(rpc, options.mint as Address);

        const ix = getUpdateMultiplierScaledUiMintInstruction(
            {
                mint: options.mint as Address,
                authority: signer.address,
                effectiveTimestamp: 0,
                multiplier: options.multiplier,
            },
            { programAddress },
        );

        const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
        const tx = pipe(
            createTransactionMessage({ version: 0 }),
            m => setTransactionMessageFeePayer(signer.address, m),
            m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
            m => appendTransactionMessageInstructions([ix], m),
        );

        const signedTransaction = await signTransactionMessageWithSigners(tx);
        assertIsTransactionWithBlockhashLifetime(signedTransaction);
        await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(signedTransaction, {
            commitment: getCommitment(),
        });
        return {
            success: true,
            transactionSignature: getSignatureFromTransaction(signedTransaction),
            multiplier: options.multiplier,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
};
