import { Contract, RpcProvider, Account, uint256, Uint256 } from "starknet";
import dotenv from "dotenv";

dotenv.config();

const provider = new RpcProvider({
  nodeUrl: process.env.ALCHEMY_API_KEY
});

const ENDURFI_CONTRACT = {
  strk: "0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a",
};

const ENDURFI_ABI = [
  {
    type: "function",
    name: "asset",
    inputs: [],
    outputs: [
      {
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "total_assets",
    inputs: [],
    outputs: [
      {
        type: "core::integer::u256",
      },
    ],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "convert_to_shares",
    inputs: [
      {
        name: "assets",
        type: "core::integer::u256",
      },
    ],
    outputs: [
      {
        type: "core::integer::u256",
      },
    ],
    state_mutability: "view",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [
      {
        name: "assets",
        type: "core::integer::u256",
      },
      {
        name: "receiver",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [
      {
        type: "core::integer::u256",
      },
    ],
    state_mutability: "external",
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      {
        name: "assets",
        type: "core::integer::u256",
      },
      {
        name: "receiver",
        type: "core::starknet::contract_address::ContractAddress",
      },
      {
        name: "owner",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [
      {
        type: "core::integer::u256",
      },
    ],
    state_mutability: "external",
  },
];

export const DepositFunction = async (tokenName: string, amount: string, accountAddress: string) => {
  try {
    if (!tokenName.toLowerCase().includes("strk")) {
      return "Only STRK is supported for EndurFi staking";
    }

    const contractAddress = ENDURFI_CONTRACT.strk;
    if (!contractAddress) {
      return "Contract address not found";
    }

    if (!process.env.PRIVATE_KEY || !process.env.WALLET_ADDRESS) {
      return "Missing WALLET_ADDRESS or PRIVATE_KEY in .env";
    }

    // Convert amount to u256 (assuming 18 decimals for STRK)
    const uintAmount = uint256.bnToUint256((Number(amount) * 10 ** 18).toString());

    const account = new Account(provider, accountAddress, process.env.PRIVATE_KEY);
    const contract = new Contract(ENDURFI_ABI, contractAddress, provider);
    contract.connect(account);

    // Check underlying asset
    const asset = await contract.call("asset", []);
    console.log("Underlying asset:", asset);

    const tx = await account.execute([
      {
        contractAddress: contractAddress,
        entrypoint: "deposit",
        calldata: [uintAmount.low.toString(), uintAmount.high.toString(), accountAddress],
      },
    ]);

    console.log("Deposit Transaction Hash:", tx.transaction_hash);
    return {
      status: "success",
      transaction_hash: tx.transaction_hash,
    };
  } catch (err) {
    console.error("Deposit error:", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

export const WithdrawFunction = async (tokenName: string, amount: string, accountAddress: string) => {
  try {
    if (!tokenName.toLowerCase().includes("strk")) {
      return "Only STRK is supported for EndurFi staking";
    }

    const contractAddress = ENDURFI_CONTRACT.strk;
    if (!contractAddress) {
      return "Contract address not found";
    }

    if (!process.env.PRIVATE_KEY || !process.env.WALLET_ADDRESS) {
      return "Missing WALLET_ADDRESS or PRIVATE_KEY in .env";
    }

    // Convert amount to u256
    const uintAmount = uint256.bnToUint256((Number(amount) * 10 ** 18).toString());

    const account = new Account(provider, accountAddress, process.env.PRIVATE_KEY);
    const contract = new Contract(ENDURFI_ABI, contractAddress, provider);
    contract.connect(account);

    const tx = await account.execute([
      {
        contractAddress: contractAddress,
        entrypoint: "withdraw",
        calldata: [uintAmount.low.toString(), uintAmount.high.toString(), accountAddress, accountAddress],
      },
    ]);

    console.log("Withdraw Transaction Hash:", tx.transaction_hash);
    return {
      status: "success",
      transaction_hash: tx.transaction_hash,
    };
  } catch (err) {
    console.error("Withdraw error:", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

export const EstimateShares = async (amount: string) => {
  try {
    const contractAddress = ENDURFI_CONTRACT.strk;
    const contract = new Contract(ENDURFI_ABI, contractAddress, provider);

    // Convert amount to u256
    const uintAmount = uint256.bnToUint256((Number(amount) * 10 ** 18).toString());

    const result = await contract.call("convert_to_shares", [uintAmount.low.toString(), uintAmount.high.toString()]);

    // Debug: Log result to check structure
    console.log("convert_to_shares result:", result);

    let resultUint256: Uint256;

    // Handle different result formats
    if (typeof result === "string") {
      resultUint256 = uint256.bnToUint256(result);
    } else if (Array.isArray(result)) {
      resultUint256 = {
        low: (result[0] || "0").toString(),
        high: (result[1] || "0").toString(),
      };
    } else if (result && typeof result === "object" && "low" in result && "high" in result) {
      resultUint256 = {
        low: (result.low || "0").toString(),
        high: (result.high || "0").toString(),
      };
    } else {
      throw new Error("Unexpected result format from convert_to_shares");
    }

    const shares = uint256.uint256ToBN(resultUint256).toString();

    console.log(`Estimated xSTRK shares for ${amount} STRK:`, shares);
    return {
      status: "success",
      estimated_shares: shares,
    };
  } catch (err) {
    console.error("Estimate shares error:", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
};

export const CheckPool = async () => {
  try {
    const contractAddress = ENDURFI_CONTRACT.strk;
    const contract = new Contract(ENDURFI_ABI, contractAddress, provider);

    const result = await contract.call("total_assets", []);

    // Debug: Log result to check structure
    console.log("total_assets result:", result);

    let resultUint256: Uint256;

    // Handle different result formats
    if (typeof result === "string") {
      resultUint256 = uint256.bnToUint256(result);
    } else if (Array.isArray(result)) {
      resultUint256 = {
        low: (result[0] || "0").toString(),
        high: (result[1] || "0").toString(),
      };
    } else if (result && typeof result === "object" && "low" in result && "high" in result) {
      resultUint256 = {
        low: (result.low || "0").toString(),
        high: (result.high || "0").toString(),
      };
    } else {
      throw new Error("Unexpected result format from total_assets");
    }

    const totalAssets = uint256.uint256ToBN(resultUint256).toString();

    console.log("Total STRK in pool:", totalAssets);
    return {
      status: "success",
      total_assets: totalAssets,
    };
  } catch (err) {
    console.error("Check pool error:", err);
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
};