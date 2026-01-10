import {
    airdropFactory,
    createTrezoaRpc,
    createTrezoaRpcSubscriptions,
    generateKeyPairSigner,
    lamports,
    type Rpc,
    type RpcSubscriptions,
    type TrezoaRpcApi,
    type TrezoaRpcSubscriptionsApi,
    type TransactionSigner,
} from '@trezoa/kit';

export interface Client {
    rpc: Rpc<TrezoaRpcApi>;
    rpcSubscriptions: RpcSubscriptions<TrezoaRpcSubscriptionsApi>;
}

export interface TestSuite {
    client: Client;
    walletsToAirdrop: TransactionSigner<string>[];
    mintAuthority: TransactionSigner<string>;
    freezeAuthority: TransactionSigner<string>;
    payer: TransactionSigner<string>;
    stableMint: TransactionSigner<string>;
    arcadeTokenMint: TransactionSigner<string>;
    tokenizedSecurityMint: TransactionSigner<string>;
}

const LAMPORTS_PER_TRZ = 1_000_000_000;
const CONFIG = {
    TREZOA_RPC_URL: 'http://127.0.0.1:8899',
    TREZOA_WS_URL: 'ws://127.0.0.1:8900',
    TRZ_DROP_AMOUNT: lamports(BigInt(LAMPORTS_PER_TRZ)),
};

async function setupTestSuite(): Promise<TestSuite> {
    // Create Trezoa client
    const rpc = createTrezoaRpc(CONFIG.TREZOA_RPC_URL);
    const rpcSubscriptions = createTrezoaRpcSubscriptions(CONFIG.TREZOA_WS_URL);
    const airdrop = airdropFactory({ rpc, rpcSubscriptions });
    const client: Client = { rpc, rpcSubscriptions };

    // Get or create keypairs
    const mintAuthority = await generateKeyPairSigner();
    const freezeAuthority = await generateKeyPairSigner();
    const payer = await generateKeyPairSigner();
    const stableMint = await generateKeyPairSigner();
    const arcadeTokenMint = await generateKeyPairSigner();
    const tokenizedSecurityMint = await generateKeyPairSigner();

    // Airdrop TRZ to possible payers
    const walletsToAirdrop = [payer, freezeAuthority, mintAuthority];
    await Promise.all(
        walletsToAirdrop.map(async recipient => {
            return airdrop({
                commitment: 'processed',
                lamports: CONFIG.TRZ_DROP_AMOUNT,
                recipientAddress: recipient.address,
            });
        }),
    );

    return {
        client,
        walletsToAirdrop,
        mintAuthority,
        freezeAuthority,
        payer,
        stableMint,
        arcadeTokenMint,
        tokenizedSecurityMint,
    };
}

export default setupTestSuite;
