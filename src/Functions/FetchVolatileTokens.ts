import { Token } from "../types/defi";
import { FetchSupportedTokens } from "../utils/defiUtils";
import axios from "axios";


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
        return {
            volatileTokensData:finalData
        }
    }catch(err){
        console.log("Error fetching the volatile tokens",err)
    }
}