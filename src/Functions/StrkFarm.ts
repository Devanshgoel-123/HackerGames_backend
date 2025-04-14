
import { Contract, RpcProvider } from "starknet";
import { FetchSupportedTokens } from "../utils/defiUtils";
import { ec } from "starknet";
import { Account } from "starknet";
import dotenv from "dotenv";
dotenv.config()
import { uint256 } from "starknet";

const provider = new RpcProvider({ nodeUrl: process.env.ALCHEMY_API_KEY });
const STRKFARMCONTRACTS={
    "usdc":"0x0115e94e722cfc4c77a2f15c4aefb0928c1c0029e5a57570df24c650cb7cec2c",
    "usdt":"0x00a858c97e9454f407d1bd7c57472fc8d8d8449a777c822b41d18e387816f29c",
    "strk":"0x07fb5bcb8525954a60fde4e8fb8220477696ce7117ef264775a1770e23571929",
    "eth":"0x05eaf5ee75231cecf79921ff8ded4b5ffe96be718bcb3daf206690ad1a9ad0ca"
}


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
        "name": "balanceOf",
        "inputs": [
          {
            "name": "account",
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
        "name": "get_user_reward_info",
        "inputs": [
          {
            "name": "user",
            "type": "core::starknet::contract_address::ContractAddress"
          }
        ],
        "outputs": [
          {
            "type": "strkfarm_contracts::components::harvester::reward_shares::UserRewardsInfo"
          }
        ],
        "state_mutability": "view"
      },
]

const getContractAddress=(tokenName:string)=>{
    if(tokenName.toLowerCase().includes("usdc")){
        return STRKFARMCONTRACTS.usdc;
    }else if(tokenName.toLowerCase().includes("usdt")){
        return STRKFARMCONTRACTS.usdt
    }else if(tokenName.toLowerCase().includes("strk")){
        return STRKFARMCONTRACTS.strk
    }else if(tokenName.toLowerCase().includes("eth")){
        return STRKFARMCONTRACTS.eth
    }else{
        return "";
    }
}

export const DepositFunction = async (tokenName:string, amount:string,accountAddress:string)=>{
    try{
    let contractAddress=getContractAddress(tokenName);
    const token=await FetchSupportedTokens();
    const finalToken=token.filter((item) => item.name.toLowerCase().includes(tokenName.toLowerCase()))[0];
    if(contractAddress===""){
        return "We currently dont support this token"
    }
    const uintAmount = uint256.bnToUint256(amount);
    const account = new Account(provider, accountAddress, `${process.env.PRIVATE_KEY}`);
    console.log
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


export const WithDrawFunction = async (tokenName:string, amount:string,accountAddress:string)=>{
    try{
        let contractAddress=getContractAddress(tokenName);
        const token=await FetchSupportedTokens();
        const contract=new Contract(depositWithdrawABI,contractAddress,provider);
        const account = new Account(provider, accountAddress, `${process.env.PRIVATE_KEY}`);
        contract.connect(account);
        const maxWithdraw= await contract.call(
            "balanceOf",
            [
                accountAddress
            ]
        );
        console.log("The maximum withdraw is",maxWithdraw.toString());
        const tx = await account.execute([
            {
              contractAddress: contractAddress,
              entrypoint: "withdraw",
              calldata: [
                Math.min(parseInt(amount),parseInt(maxWithdraw.toString())),
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