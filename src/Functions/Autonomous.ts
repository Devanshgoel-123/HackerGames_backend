import { prisma } from "../db";
import { fetchUserPortfolio } from "./Portfolio";
import { fetchTokenPrices, getTokenPrice, provider } from "../utils/defiUtils";
import { Account } from "starknet";
import { ACCOUNT_ADDRESS } from "../constants/contracts";
import { FetchVolatileTokens } from "./FetchVolatileTokens";
import { DepositFunctionEndufi } from "./EnduFi";

interface TradeInput {
    agentWallet: string;
    amount: number; 
    fromAsset :string;
    txHash:string;
    toAsset: string;
}

interface Deposit{
    agentWallet : string;
    userWallet : string;
    amount : string;
    stopLoss : string;
    expectedProfit : string;
    deadline : Date
}

export const saveTransactionByAgent= async (input:TradeInput)=>{
    try{
    const { agentWallet, amount, fromAsset, txHash, toAsset } = input;
      const result=await prisma.trade.create({
        data:{
            agentWallet:agentWallet,
            amount:amount,
            fromAsset,
            toAsset,
            txHash,
        }
      })
      return {
        message:`Saved the transaction with hash ${result.txHash}`
      }
    }catch(err){
        console.log("Error saving the transaction by agent",err);
    }
}


export const MakeDepositToAgent=async (input:Deposit)=>{
    try{
        const {
            agentWallet,
            amount,
            userWallet,
            stopLoss,
            expectedProfit,
            deadline
        }=input;
        let user = await prisma.user.findFirst({
            where: {
                walletAddress: userWallet.toLowerCase()
            }
        });
        const STARK_TOKEN_ADDRESS="0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
        const tokenPrice=await getTokenPrice(STARK_TOKEN_ADDRESS)
        console.log('the user is',user?.id)
        if (user === null) {
            user = await prisma.user.create({
                data: {
                    walletAddress: userWallet.toLowerCase(),
                }
            });
        }
        const amountInUsd=tokenPrice*Number(amount);
        const result=await prisma.deposit.create({
            data:{
                agentWallet,
                userWallet,
                amount:amountInUsd,
                stopLoss,
                expectedProfit,
                deadline
            }
        })
        return {
            message:"Successfully created the Deposit to the agent wallet",
            success:true,
            data: result
        }
    }catch(err){
        console.log("Error depositing funds to agent Wallet",err)
        return {
            message:"Error depositing in the wallet",
            success:false,
            data: err
        }
    }
}

export const fetchTransactionByAgent=async (agentWalletAddress:string)=>{
    try{
        const result=await prisma.trade.findMany({
            where:{
                agentWallet:agentWalletAddress
            }
        })
        if(result===null){
            return {
                message:"Couldn't find any transactions for the agent"
            }
        }
    return {
        message:result
    }
    }catch(err){
        console.log("Error fetching the transactions by the agent")
        return {
            message:"Error Fetching any transactions by the agent"
        }
    }
}


export const maximiseProfit=async ()=>{
    try{
    const account = new Account(provider, ACCOUNT_ADDRESS, `${process.env.PRIVATE_KEY}`);
     const portfolio=await fetchUserPortfolio(ACCOUNT_ADDRESS);
     console.log(portfolio.total_value_usd,portfolio.tokens);
     const volatileAssets=await FetchVolatileTokens();
      console.log(volatileAssets)
    }catch(err){
        console.log(err,"Error maximising the portoflio")
    }
}