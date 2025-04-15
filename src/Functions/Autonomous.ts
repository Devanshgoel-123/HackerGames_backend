import { prisma } from "../db";
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
                walletAddress: userWallet
            }
        });
        if (user === null) {
            user = await prisma.user.create({
                data: {
                    walletAddress: userWallet,
                }
            });
        }
        
        const result=await prisma.deposit.create({
            data:{
                agentWallet,
                userWallet,
                amount,
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