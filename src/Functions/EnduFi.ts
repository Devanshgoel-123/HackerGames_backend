import { Contract, RpcProvider } from "starknet";
import { FetchSupportedTokens } from "../utils/defiUtils";
import { ec } from "starknet";
import { Account } from "starknet";
import dotenv from "dotenv";
dotenv.config()
import { uint256 } from "starknet";

const provider = new RpcProvider({ nodeUrl: process.env.ALCHEMY_API_KEY });
const ENDUFICONTRACT="0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a";

const depositWithdrawABI=[
  {
    "type": "function",
    "name": "deposit",
    "inputs": [
      {
        "name": "assets",
        "type": "core::integer::u256"
      },
      {
        "name": "receiver",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "core::integer::u256"
      }
    ],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "withdraw",
    "inputs": [
      {
        "name": "assets",
        "type": "core::integer::u256"
      },
      {
        "name": "receiver",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "core::integer::u256"
      }
    ],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {
        "name": "spender",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "external"
  },
  {
    "type": "function",
    "name": "max_withdraw",
    "inputs": [
      {
        "name": "owner",
        "type": "core::starknet::contract_address::ContractAddress"
      }
    ],
    "outputs": [
      {
        "type": "core::integer::u256"
      }
    ],
    "state_mutability": "view"
  },
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {
        "name": "spender",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "amount",
        "type": "core::integer::u256"
      }
    ],
    "outputs": [
      {
        "type": "core::bool"
      }
    ],
    "state_mutability": "external"
  }
]


export const DepositFunctionEndufi = async (amount:string,accountAddress:string)=>{
    try{
    let contractAddress=ENDUFICONTRACT;
    if(contractAddress===""){
        return "We currently dont support this token"
    }
    const uintAmount = uint256.bnToUint256((Number(amount)*(10**18)).toString());
    const account = new Account(provider, accountAddress, `${process.env.PRIVATE_KEY}`);
    console.log(uintAmount)
    const tx = await account.execute([
        {
          contractAddress: contractAddress,
          entrypoint: "deposit",
          calldata: [
            uintAmount,
            accountAddress
          ]
        }
      ]);
      console.log("Transaction Hash:", tx.transaction_hash);
  
    }catch(err){
        console.log("The error is",err)
    }
}


export const WithDrawFunctionEndufi = async (tokenName:string, amount:string,accountAddress:string)=>{
    try{
        let contractAddress=ENDUFICONTRACT;
        const contract=new Contract(depositWithdrawABI,contractAddress,provider);
        const account = new Account(provider, accountAddress, `${process.env.PRIVATE_KEY}`);
        contract.connect(account);
        const maxWithdraw= await contract.call(
            "max_withdraw",
            [
                accountAddress
            ]
        );
        console.log("The maximum withdraw is",maxWithdraw.toString());
        const withdrawAmount = BigInt(Number(amount) * 10 ** 18);
        const finalAmount = Number(withdrawAmount) > Number(maxWithdraw) ? maxWithdraw : withdrawAmount;
        const uintAmount = uint256.bnToUint256(finalAmount.toString());
        console.log("the withdraw amount is",withdrawAmount)
        const tx = await account.execute([
            {
              contractAddress: contractAddress,
              entrypoint: "withdraw",
              calldata: [
                uintAmount,
                accountAddress,
                accountAddress
              ]
            }
          ]);
        console.log("Executed withdraw successfully Transaction Hash:", tx.transaction_hash);
    }catch(err){
        console.log("The error is",err)
    }
}
