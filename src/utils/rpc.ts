import axios from 'axios';

export enum BlockTag {
    LATEST = 'latest',
    PENDING = 'pending'
}

export class RpcChannel {
    private nodeUrl: string;
    private headers: object;
    private blockIdentifier: BlockTag | number;

    constructor(options?: {
        nodeUrl?: string;
        headers?: object;
        blockIdentifier?: BlockTag | number
    }) {
        this.nodeUrl = options?.nodeUrl || 'https://starknet-mainnet.public.blastapi.io/rpc/v0_6';
        this.headers = options?.headers || { 'Content-Type': 'application/json' };
        this.blockIdentifier = options?.blockIdentifier || BlockTag.LATEST;
    }

    private async sendRpcRequest(method: string, params: any[]): Promise<any> {
        try {
            const response = await axios.post(this.nodeUrl, {
                jsonrpc: '2.0',
                method,
                params,
                id: 1
            }, { headers: this.headers });

            if (response.data.error) {
                throw new Error(response.data.error.message);
            }

            return response.data.result;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`RPC request failed: ${error.message}`);
            }
            throw error;
        }
    }

    async getTransactionByHash(transactionHash: string): Promise<any> {
        return this.sendRpcRequest('starknet_getTransactionByHash', [transactionHash]);
    }

    async getTransactionReceipt(transactionHash: string): Promise<any> {
        return this.sendRpcRequest('starknet_getTransactionReceipt', [transactionHash]);
    }

    async getTransactionStatus(transactionHash: string): Promise<any> {
        return this.sendRpcRequest('starknet_getTransactionStatus', [transactionHash]);
    }
}