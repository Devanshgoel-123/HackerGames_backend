import { StarknetTransactionTool } from '../starknetTransactionTool';
import { RpcChannel } from '../../utils/rpc';

jest.mock('../../utils/rpc'); // Mock the RpcChannel class

describe('StarknetTransactionTool', () => {
    let tool: StarknetTransactionTool;

    beforeEach(() => {
        // Reset mocks and create a new tool instance
        jest.clearAllMocks();
        tool = new StarknetTransactionTool();
    });

    it('should fetch transaction data for a valid hash', async () => {
        // Mock RpcChannel methods
        (RpcChannel.prototype.getTransactionByHash as jest.Mock).mockResolvedValue({ hash: '0x123' });
        (RpcChannel.prototype.getTransactionReceipt as jest.Mock).mockResolvedValue({ receipt: 'receipt data' });
        (RpcChannel.prototype.getTransactionStatus as jest.Mock).mockResolvedValue({ status: 'success' });

        const input = '0x123';
        const result = await tool._call(input);

        expect(JSON.parse(result)).toEqual({
            transaction: { hash: '0x123' },
            receipt: { receipt: 'receipt data' },
            status: { status: 'success' },
        });
    });

    it('should handle invalid transaction hash format', async () => {
        const input = 'invalid-hash';
        const result = await tool._call(input);

        expect(result).toBe('Error fetching transaction data: Invalid transaction hash format. Please provide a valid hex string.');
    });

    it('should handle errors from RPC calls', async () => {
        (RpcChannel.prototype.getTransactionByHash as jest.Mock).mockRejectedValue(new Error('RPC error'));

        const input = '0x123';
        const result = await tool._call(input);

        expect(result).toBe('Error fetching transaction data: RPC error');
    });

    it('should normalize transaction hash without 0x prefix', async () => {
        // Mock the methods to return successful results
        (RpcChannel.prototype.getTransactionByHash as jest.Mock).mockResolvedValue({ hash: '0x123' });
        (RpcChannel.prototype.getTransactionReceipt as jest.Mock).mockResolvedValue({ receipt: 'receipt data' });
        (RpcChannel.prototype.getTransactionStatus as jest.Mock).mockResolvedValue({ status: 'success' });

        const input = '123'; // No 0x prefix
        const result = await tool._call(input);

        // Verify the response can be parsed as JSON and matches expected format
        expect(JSON.parse(result)).toEqual({
            transaction: { hash: '0x123' },
            receipt: { receipt: 'receipt data' },
            status: { status: 'success' },
        });

        // Verify that normalized hash (with 0x prefix) was used in the RPC call
        expect(RpcChannel.prototype.getTransactionByHash).toHaveBeenCalledWith('0x123');
    });

    it('should accept transaction hash in JSON object format', async () => {
        // Mock RpcChannel methods
        (RpcChannel.prototype.getTransactionByHash as jest.Mock).mockResolvedValue({ hash: '0x456' });
        (RpcChannel.prototype.getTransactionReceipt as jest.Mock).mockResolvedValue({ receipt: 'receipt data' });
        (RpcChannel.prototype.getTransactionStatus as jest.Mock).mockResolvedValue({ status: 'success' });

        const input = JSON.stringify({ transactionHash: '0x456' });
        const result = await tool._call(input);

        expect(JSON.parse(result)).toEqual({
            transaction: { hash: '0x456' },
            receipt: { receipt: 'receipt data' },
            status: { status: 'success' },
        });
    });
});