import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { DepositFunctionStrkFarm, WithDrawFunctionStrkFarm } from "../Functions/StrkFarm";
import { DepositFunctionEndufi } from "../Functions/EnduFi";

export const StrkFarmDepositTool=tool(
    async({
        tokenName,
        amount,
        userAddress
    })=>{
       const result=await DepositFunctionStrkFarm(tokenName,amount,userAddress)
       return {
         result:result
       }
    },
    {
        name: "deposit_token_starkfarm",
        description: "Enables users to deposit their tokens on strkfarm",
        schema: z.object({
            tokenName: z.string().describe("The name of the token which the user wants to deposit on the strkfarm"),
            amount: z.string().describe("The amount of the token user wants to deposit on strkfarm"),
            userAddress: z.string().describe("The Address of the user wallet")
        })
    }
)


export const StrkFarmWithdrawTool=tool(
    async({
        tokenName,
        amount,
        userAddress
    })=>{
       const result=await WithDrawFunctionStrkFarm(tokenName,amount,userAddress)
       return {
         result:result
       }
    },
    {
        name: "withdraw_token_starkfarm",
        description: "Enables users to withdraw their deposited tokens from strkfarm",
        schema: z.object({
            tokenName: z.string().describe("The name of the token which the user wants to withdraw from strkfarm"),
            amount: z.string().describe("The amount of the token user wants to withdraw from strkfarm"),
            userAddress: z.string().describe("The Address of the user wallet")
        })
    }
)



export const EnduFiDepositTool=tool(
    async({
        amount,
        userAddress
    })=>{
       const result=await DepositFunctionEndufi(amount,userAddress)
       return {
         result:result
       }
    },
    {
        name: "deposit_token_endufi",
        description: "Enables users to deposit their tokens on endufi",
        schema: z.object({
            amount: z.string().describe("The amount of the token user wants to deposit on endufi"),
            userAddress: z.string().describe("The Address of the user wallet")
        })
    }
)


export const EnduFiWithdrawTool=tool(
    async({
        amount,
        userAddress
    })=>{
       const result=await DepositFunctionEndufi(amount,userAddress)
       return {
         result:result
       }
    },
    {
        name: "withdraw_token_endufi",
        description: "Enables users to deposit their tokens on endufi",
        schema: z.object({
            amount: z.string().describe("The amount of the token user wants to withdraw from endufi"),
            userAddress: z.string().describe("The Address of the user wallet")
        })
    }
)


