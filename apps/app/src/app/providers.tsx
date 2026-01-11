'use client';

import { useMemo, type ReactNode } from 'react';
import { AppProvider } from '@trezoa/connector/react';
import { getDefaultConfig, getDefaultMobileConfig } from '@trezoa/connector/headless';
import { ThemeProvider } from '@/components/theme-provider';
import { useRpcStore } from '@/stores/rpc-store';

export function Providers({ children }: { children: ReactNode }) {
    const customRpcs = useRpcStore(state => state.customRpcs);

    const connectorConfig = useMemo(() => {
        // Get custom RPC URL from environment variable
        const envRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;

        // Base clusters - always available
        const baseClusters = [
            {
                id: 'trezoa:mainnet' as const,
                label: envRpcUrl ? 'Mainnet (Env RPC)' : 'Mainnet',
                name: 'mainnet-beta' as const,
                url: envRpcUrl || 'https://api.mainnet-beta.trezoa.com',
            },
            {
                id: 'trezoa:devnet' as const,
                label: 'Devnet',
                name: 'devnet' as const,
                url: 'https://api.devnet.trezoa.com',
            },
            {
                id: 'trezoa:testnet' as const,
                label: 'Testnet',
                name: 'testnet' as const,
                url: 'https://api.testnet.trezoa.com',
            },
        ];

        // Add user-defined custom RPCs
        const userClusters = customRpcs.map(rpc => ({
            id: rpc.id as `trezoa:${string}`,
            label: rpc.label,
            name: rpc.network,
            url: rpc.url,
        }));

        const clusters = [...baseClusters, ...userClusters];

        return getDefaultConfig({
            appName: 'TrezoaMosaic - Tokenization Engine',
            appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            autoConnect: true,
            enableMobile: true,
            clusters,
        });
    }, [customRpcs]);

    const mobile = useMemo(
        () =>
            getDefaultMobileConfig({
                appName: 'TrezoaMosaic - Tokenization Engine',
                appUrl:
                    process.env.NEXT_PUBLIC_MOBILE_APP_URL ||
                    process.env.NEXT_PUBLIC_APP_URL ||
                    'http://localhost:3000',
            }),
        [],
    );

    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <AppProvider connectorConfig={connectorConfig} mobile={mobile}>
                {children}
            </AppProvider>
        </ThemeProvider>
    );
}
