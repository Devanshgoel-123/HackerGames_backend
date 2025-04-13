
import { Portfolio, TokenForPortfolio } from "../types/defi";
import { FetchSupportedTokens } from "../utils/defiUtils";
import { Token } from "../types/defi";
import { RpcProvider, Contract, Call, constants, Provider } from 'starknet';
import { fetchTokenPrices } from "../utils/defiUtils";
import { fetchTokenBalance } from "../utils/defiUtils";
import { it } from "node:test";



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
// export function calculateCurrentAllocation(portfolio: Portfolio): Record<TokenCategory, number> {
//     const allocations: Record<TokenCategory, number> = {
//       [TokenCategory.STABLECOIN]: 0,
//       [TokenCategory.NATIVE]: 0,
//       [TokenCategory.OTHER]: 0
//     };
    
//     const totalValue = portfolio.total_value_usd;
//     if (totalValue === 0) return allocations;
    
//     for (const token of portfolio.tokens) {
//       allocations[token.category] += (token.value_usd / totalValue) * 100;
//     }
    
//     Object.keys(allocations).forEach(key => {
//       allocations[key as TokenCategory] = parseFloat(allocations[key as TokenCategory].toFixed(2));
//     });
//     console.log("The current allocations are:",allocations)
//     return allocations;
//   }

  