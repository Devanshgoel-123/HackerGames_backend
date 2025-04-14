import axios from "axios";
import { SwapAction } from "../types/defi";
import { executeSwap } from "@avnu/avnu-sdk";
import { Account } from "starknet";
import { provider } from "../utils/defiUtils";
import { constants } from "starknet";


export const SingularSwapExecution=async (swap:SwapAction,userAddress:string)=>{
    try{
        console.log("calling the singular swap tool")
        const formattedAmount ='0x'+BigInt(swap.amount).toString(16);
        const account = new Account(
            provider,
            userAddress,
            `${process.env.PRIVATE_KEY}`,
            undefined,
            constants.TRANSACTION_VERSION.V3
          );
          console.log("The formatted amount is ",formattedAmount)
        const quoteRes = await axios.get('https://starknet.api.avnu.fi/swap/v2/quotes', {
            params: {
              sellTokenAddress: swap.from_token_address,
              buyTokenAddress: swap.to_token_address,
              takerAddress: userAddress,
              sellAmount: formattedAmount,
            },
          });
          const dataObject=quoteRes.data[0];
          console.log("The quotes from sdk are",dataObject)
          if (!quoteRes.data.length) {
            throw new Error('No quotes available for this swap');
          }
           try{
            const executeSwapTransaction = await executeSwap(account,dataObject, {
              slippage: 0.1,
            });
            console.log(`✅ Swap successful! Tx hash: ${executeSwapTransaction.transactionHash} ${swap.from_token_address} ${swap.to_token_address}`);
            return executeSwapTransaction.transactionHash;
           }catch(err){
            console.log("Error while sending the transactions",err);
           }
    }catch(err){

    }
}