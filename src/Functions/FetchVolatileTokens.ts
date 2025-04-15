import { SwapAction, Token } from "../types/defi";
import { FetchSupportedTokens, fetchTokenBalance } from "../utils/defiUtils";
import axios from "axios";
import { SingularSwapExecution } from "./SwapFunction";
import {  Contract } from "starknet";
import { provider } from "../utils/defiUtils";


export const FetchVolatileTokens=async ()=>{
    try{
        const supportedTokens = await FetchSupportedTokens();
    
        const formattedTokens = supportedTokens.map((item) => {
          const chainName = "starknet";
          return `${chainName}:${item.token_address}`;
        }).join(",");
      
        const apiUrl = `https://coins.llama.fi/percentage/${formattedTokens}`;
        const response = await axios.get(apiUrl);
        
        if (response.status < 200 || response.status >= 300) {
          throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
        }      
        const data = response.data;
        console.log(data.coins)
        const finalData = supportedTokens.map((item: Token) => {
            const tokenKey = `starknet:${item.token_address}`;
            const volatilityData = data.coins[tokenKey];
            
            return {
              ...item,
              volatility: volatilityData || 0,
            };
        });
        console.log(finalData)
        return {
            volatileTokensData:finalData
        }
    }catch(err){
        console.log("Error fetching the volatile tokens",err)
    }
}



export const SwapVolatileAssets=async (userAddress:string)=>{
  try{
    const data=await FetchVolatileTokens();
    console.log(data?.volatileTokensData)
    const stablecoinAddress="0x53c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";
    const fallingTokens=data?.volatileTokensData.filter((item)=>item.volatility < -5).map((item)=>{
      return {
        address:item.token_address,
        decimals:item.decimals
      }
    })
    if(fallingTokens?.length === 0 || fallingTokens===undefined){
      return {
        status:true,
        message:"Market is good, no falling tokens"
      }
    }
    const topGainers = data?.volatileTokensData.filter(token => token.volatility > 5).sort((a, b) => b.volatility - a.volatility);
    const mostProfitableToken = topGainers?.[0];
    for (const token of fallingTokens) {
      const tokenAddress = token.address;
      const get_abi = provider.getClassAt(token.address);
		  const contract = new Contract((await get_abi).abi, token.address, provider);
		  const balance = await contract.call("balanceOf", [userAddress]);
      let amountToStable;
      let amountToProfitToken;
      let txhash:string[]=[];
      if(mostProfitableToken !==undefined){
        amountToStable=Math.floor(Number(balance.toString())*0.7);
        amountToProfitToken = Math.floor(Number(balance.toString())*0.3)
      }else{
        amountToStable=Math.floor(Number(balance.toString()));
        amountToProfitToken=0;
      }
      const stableSwap: SwapAction = {
        from_token_address: tokenAddress,
        to_token_address: stablecoinAddress,
        chainId: 1,
        fromTokenDecimals: token.decimals,
        amount: amountToStable
      };
      const result=await SingularSwapExecution(stableSwap,userAddress);
      txhash.push(result || "");
      if(mostProfitableToken!==undefined){
        const profitSwap: SwapAction = {
          from_token_address: tokenAddress,
          to_token_address: mostProfitableToken?.token_address,
          chainId: 1,
          fromTokenDecimals: token.decimals,
          amount: amountToProfitToken
        };
        const tx2=await SingularSwapExecution(profitSwap,userAddress)
        txhash.push(tx2 || "");
      }

    return {
      success:true,
      message:"Swap the volatile assets to perfect ratio"
    }
  }
  }catch(err){
    return {
      success:false,
      message:"Swap the volatile assets to perfect ratio"
    }
  }
}