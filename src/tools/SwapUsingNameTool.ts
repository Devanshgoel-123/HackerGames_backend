
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { FetchSupportedTokens, provider } from "../utils/defiUtils";
import { Account } from "starknet";
import dotenv from "dotenv";
import { prisma } from "../db";
import { uint256 } from "starknet";

dotenv.config();
export const SwapUsingNameTool=tool(
    async({
       userWalletAddress,
       receiverName,
       amount
    })=>{
        console.log("The tools detials",userWalletAddress,receiverName,amount)
       const result=await sendFundsToContact(userWalletAddress,receiverName,amount);
       return result
    },
    {
        name: "withdraw_token_endufi",
        description: "Enables users to deposit their tokens on endufi",
        schema: z.object({
            userWalletAddress: z.string().describe("The amount of the token user wants to withdraw from endufi"),
            receiverName: z.string().describe("The name of the receiver"),
            amount:z.string().describe("The amount of tokens we need to transfer"),
            token:z.string().describe("The name of the token we need to send to that user")
        })
    }
)



const sendFundsToContact=async (userWalletAddress:string,receiverName:string,amount:string)=>{
    try{
        const account=new Account(provider,userWalletAddress,`${process.env.PRIVATE_KEY}`);
        const user=await prisma.userContact.findFirst({
            where:{
                address:userWalletAddress
            }
        })
        if(user===null){
            return "User Wallet not registered"
        }
        console.log("The name of the user is:",user.name)
        const allTokens=await FetchSupportedTokens();
        const tokenAddress=allTokens.filter((item)=>item.name.toLowerCase()===receiverName.toLowerCase())[0];
        const receiverAddress=await prisma.userContact.findFirst({
            where:{
                userId:user.id,
                name:receiverName.toLowerCase()
            }
        })
        if (!tokenAddress.token_address) {
            return "Token not found";
        }
        if (!receiverAddress || !receiverAddress.address) {
            return "Receiver not found";
        }
        const decimals = tokenAddress.decimals || 18;
        const uintAmount = uint256.bnToUint256((Number(amount)*(10**18)).toString());
        const parsedAmount = BigInt(parseFloat(amount) * 10 ** decimals);
        const transferCall = {
            contractAddress: tokenAddress.token_address, 
            entrypoint: "transfer",
            calldata:[
                receiverAddress ,
                uintAmount
                 ]
          };
      
          const tx = await account.execute(transferCall);
          const result=tx.transaction_hash;
          console.log(result)
          return `Successfully transferred funds from ${userWalletAddress} to ${receiverName} ${result}`;
    }catch(err){
        console.log(err,"The error is in sending funds to receiver")
        return err
    }
}