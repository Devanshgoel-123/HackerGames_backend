
import { Portfolio, TokenForPortfolio } from "../types/defi";
import { FetchSupportedTokens } from "../utils/defiUtils";
import { Token } from "../types/defi";
import { RpcProvider, Contract, Call, constants, Provider, BigNumberish } from 'starknet';
import { fetchTokenPrices } from "../utils/defiUtils";
import { fetchTokenBalance } from "../utils/defiUtils";
import { SwapAction } from "../types/defi";
import { ec, stark, hash, transaction } from 'starknet';
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import dotenv from "dotenv";
import { WeierstrassSignatureType, Signature, Account } from "starknet";
import { executeSwap, fetchQuotes, QuoteRequest, Quote } from '@avnu/avnu-sdk';
dotenv.config()
const prisma = new PrismaClient();

enum TokenCategory {
    STABLECOIN = "stable",
    NATIVE = "native",
    OTHER = "other"
}

interface UserPreference {
  walletAddress: string;
  targetAllocation: Record<TokenCategory, number>;
}

export async function fetchUserPortfolio(accountAddress: string): Promise<Portfolio> {
    const tokens = await FetchSupportedTokens();
    console.log("The supported tokens are:",tokens);
    let totalValueUsd = 0;
    const tokenPrices = await fetchTokenPrices(
        tokens,
    );
    const tokensToCheck = tokens.map((token)=>{
        return {
        address: token.token_address,
        name: token.name,
        decimals:token.decimals,
        type:token.type,
        image:token.image
        }
    })
    console.log("THe tokens to check are",tokensToCheck)
    const balancesWithUSD = await Promise.all(
        tokensToCheck.map((token: any) =>
            fetchTokenBalance(token, accountAddress, tokenPrices)
        )
    );
    balancesWithUSD.map((item:TokenForPortfolio)=>{
        totalValueUsd+=Number(item.valueUsd)
    })
    console.log(balancesWithUSD)
    return {
      total_value_usd: totalValueUsd,
      tokens: balancesWithUSD
    };
}
  
  /**
   * Function to calculate the current diversity of the portfolio
   * @param portfolio 
   * @returns the current diversity of the portfolio
//    */
export function calculateCurrentAllocation(portfolio: Portfolio): Record<TokenCategory, number> {
    const allocations: Record<TokenCategory, number> = {
      [TokenCategory.STABLECOIN]: 0,
      [TokenCategory.NATIVE]: 0,
      [TokenCategory.OTHER]: 0
    };
    
    const totalValue = portfolio.total_value_usd;
    if (totalValue === 0) return allocations;
    
    for (const token of portfolio.tokens) {
      allocations[token.type as TokenCategory] += (Number(token.valueUsd) / totalValue) * 100;
    }
    
    Object.keys(allocations).forEach(key => {
      allocations[key as TokenCategory] = parseFloat(allocations[key as TokenCategory].toFixed(2));
    });
    console.log("The current allocations are:",allocations)
    return allocations;

  }

  
  export const calculateRequiredSwaps=(
    portfolio: Portfolio,
    currentAllocation: Record<TokenCategory, number>,
    targetAllocation: Record<TokenCategory, number>
  ): SwapAction[] => {
    const swaps: SwapAction[] = [];
    const totalValue = portfolio.total_value_usd;
      console.log("Calculating swaps");
    // Convert percentage allocations to USD values
    const targetValues: Record<TokenCategory, number> = {
      [TokenCategory.STABLECOIN]: (targetAllocation[TokenCategory.STABLECOIN] / 100) * totalValue,
      [TokenCategory.NATIVE]: (targetAllocation[TokenCategory.NATIVE] / 100) * totalValue,
      [TokenCategory.OTHER]: (targetAllocation[TokenCategory.OTHER] / 100) * totalValue
    };
    
    const currentValues: Record<TokenCategory, number> = {
      [TokenCategory.STABLECOIN]: (currentAllocation[TokenCategory.STABLECOIN] / 100) * totalValue,
      [TokenCategory.NATIVE]: (currentAllocation[TokenCategory.NATIVE] / 100) * totalValue,
      [TokenCategory.OTHER]: (currentAllocation[TokenCategory.OTHER] / 100) * totalValue
    };
    
    const categoriesToReduce: TokenCategory[] = [];
    const categoriesToIncrease: TokenCategory[] = [];
    
    Object.values(TokenCategory).forEach(category => {
      if (currentValues[category] > targetValues[category]) {
        categoriesToReduce.push(category);
      } else if (currentValues[category] < targetValues[category]) {
        categoriesToIncrease.push(category);
      }
    });
  
    for (const fromCategory of categoriesToReduce) {
      const tokensToReduce = portfolio.tokens.filter(t => t.type === fromCategory);
      tokensToReduce.sort((a, b) => Number(b.valueUsd) - Number(a.valueUsd));
      
      let valueToReduce = currentValues[fromCategory] - targetValues[fromCategory]; //let's say this is 5 usd
      console.log("the value to reduce is:",valueToReduce)
      for (const increaseCategory of categoriesToIncrease) {
        const valueToIncrease = targetValues[increaseCategory] - currentValues[increaseCategory];
        
        if (valueToIncrease <= 0) continue;
        const tokensToIncrease = portfolio.tokens.filter(t => t.type === increaseCategory);
  
        const toTokenAddress = tokensToIncrease.length > 0 ? tokensToIncrease[0].address : (
          increaseCategory === TokenCategory.STABLECOIN ? "0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8" : 
          increaseCategory === TokenCategory.NATIVE ? "0x4718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" :
          "0x75afe6402ad5a5c20dd25e10ec3b3986acaa647b77e4ae24b0cbc9a54a27a87" 
        );
        const swapValue = Math.min(valueToReduce, valueToIncrease);
        let remainingSwapValue = swapValue;
        
        for (const fromToken of tokensToReduce) {
          if (remainingSwapValue <= 0) break;
          
          const swapAmountFromThisToken = Math.min(Number(fromToken.valueUsd), remainingSwapValue);
          console.log("the swap amount from this token is",swapAmountFromThisToken,fromToken.name)
          const tokenAmount = (swapAmountFromThisToken / Number(fromToken.priceUsd));
          console.log("the amount of token is",tokenAmount)
          swaps.push({
            from_token_address: fromToken.address,
            to_token_address: toTokenAddress,
            amount: tokenAmount,
            chainId: 12,
            fromTokenDecimals:Number(fromToken.decimals)
          });
          
          remainingSwapValue -= swapAmountFromThisToken;
        }
       
        valueToReduce -= swapValue;
        if (valueToReduce <= 0) break;
      }
    }
    console.log("the swaps are",swaps)
    return swaps;
  }


  /**
 * Gets the user's current diversification preference from the database
 */
export async function getUserDiversificationPreference(walletAddress: string): Promise<UserPreference | null> {
  try {
    const preference = await prisma.userPortfolioPreference.findUnique({
      where: { walletAddress }
    });
    if (!preference) return null;
    console.log("The preference of user are",preference);
    return {
      walletAddress: preference.walletAddress,
      targetAllocation: {
        [TokenCategory.STABLECOIN]: preference.StablePercentage,
        [TokenCategory.NATIVE]: preference.NativePercentage,
        [TokenCategory.OTHER]: preference.OtherPercentage
      }
    };
  } catch (error) {
    console.error("Error fetching user preference:", error);
    return null;
  }
}

/**
 * Saves user preference to the database
 */
async function saveUserPreference(
  walletAddress: string, 
  targetAllocation: Record<TokenCategory, number>
): Promise<void> {
  try {
    console.log("Saving user preferences");
    await prisma.userPortfolioPreference.upsert({
      where: { walletAddress },
      update: {
        StablePercentage: targetAllocation[TokenCategory.STABLECOIN],
        NativePercentage: targetAllocation[TokenCategory.NATIVE],
        OtherPercentage: targetAllocation[TokenCategory.OTHER]
      },
      create: {
        walletAddress,
        StablePercentage: targetAllocation[TokenCategory.STABLECOIN],
        NativePercentage: targetAllocation[TokenCategory.NATIVE],
        OtherPercentage: targetAllocation[TokenCategory.OTHER]
      }
    });
    console.log("Saved succesfully")
  } catch (error) {
    console.error("Error saving user preference:", error);
    throw new Error(`Failed to save user preference: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const RebalancerReusableFunction = async (
    stablecoinPercentage: number,
    nativePercentage: number,
    otherPercentage: number,
    accountAddress:string
  ) => {
    try {
   
      const existingPreference = await getUserDiversificationPreference(accountAddress);
      
      let finalStablePercentage = stablecoinPercentage ;
      let finalNativePercentage = nativePercentage;
      let finalOtherPercentage = otherPercentage;
      
      if (stablecoinPercentage === undefined && nativePercentage === undefined && otherPercentage === undefined) {
        if (!existingPreference) {
          return {
            success: false,
            message: "No target allocation provided and no existing preferences found."
          };
        }
        
        finalStablePercentage = existingPreference.targetAllocation[TokenCategory.STABLECOIN];
        finalNativePercentage = existingPreference.targetAllocation[TokenCategory.NATIVE];
        finalOtherPercentage = existingPreference.targetAllocation[TokenCategory.OTHER];
      }
      
      const totalPercentage = finalStablePercentage + finalNativePercentage + finalOtherPercentage;
      if (totalPercentage !== 100) {
        return {
          success: false,
          message: `Invalid allocation. Your percentages must add up to 100%, but they currently add up to ${totalPercentage}%.`
        };
      }
  
      const targetAllocation: Record<TokenCategory, number> = {
        [TokenCategory.STABLECOIN]: finalStablePercentage,
        [TokenCategory.NATIVE]: finalNativePercentage,
        [TokenCategory.OTHER]: finalOtherPercentage
      }; 

      console.log(targetAllocation)
      
      const userPortfolio = await fetchUserPortfolio(accountAddress);

      const currentAllocation = calculateCurrentAllocation(userPortfolio);
      const requiredSwaps = calculateRequiredSwaps(
        userPortfolio,
        currentAllocation,
        targetAllocation
      );

      console.log(requiredSwaps)
      if (requiredSwaps.length === 0) {

        await saveUserPreference(accountAddress, targetAllocation);
        
        return {
          success: true,
          message: "Portfolio is already balanced according to target allocation.",
          currentAllocation,
          targetAllocation,
          userPortfolio
        };
      }
      await executeSwapFunction(requiredSwaps,accountAddress)
      await saveUserPreference(accountAddress, targetAllocation);
      return {
        success: true,
        message: `Swapped the required assets on your behalf, swap successful.`,
        currentAllocation,
        targetAllocation,
        userPortfolio,
      };
    } catch (error) {
      console.error("Portfolio rebalancing failed:", error);
      return {
        success: false,
        message: `Portfolio rebalancing failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  };
  


export const executeSwapFunction=async (swaps:SwapAction[],userAddress:string)=>{
  try{
  const formattedAmount ='0x'+BigInt(Math.floor(0.0007 * 10**(swaps[0].fromTokenDecimals))).toString();
  const provider = new Provider({
    nodeUrl:`${process.env.ALCHEMY_API_KEY}`
  });
  

  const account = new Account(
    provider,
    userAddress,
    `${process.env.PRIVATE_KEY}`,
    undefined,
    constants.TRANSACTION_VERSION.V3
  );
  const result= await axios.get('https://starknet.api.avnu.fi/swap/v2/quotes', {
    params:{
      sellTokenAddress:swaps[0].from_token_address,
      buyTokenAddress:swaps[0].to_token_address,
      takerAddress:userAddress,
      sellAmount:formattedAmount
    }
});
console.log(result.data); 
const dataObject=result.data[0];
  console.log("The quotes from sdk are",)
  if (!result.data?.length) {
    throw new Error('No quotes available for this swap');
  }
 
  const swapResult = await executeSwap(account,dataObject, {
    slippage: 0.1,
  });
  console.log(swapResult)
 
}catch(err){
    console.log("The error is",err)
    return err;
  }
} 