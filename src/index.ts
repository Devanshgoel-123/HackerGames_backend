import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser = require("body-parser");
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import axios from "axios";
import { chatFunction } from "./Agents/agentService";
import { UserPortfolioRouter } from "./Routes/UserPortfolio";
dotenv.config()
const app: Express = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/userPortfolio",UserPortfolioRouter)
const PORT = process.env.PORT || 3000;



app.get("/", async (req: Request, res: Response):Promise<any> => {
    try{
    const {message}=req.body;
    const result = await generateText({
            model: anthropic("claude-3-5-sonnet-latest"),
            prompt: `${message}`,
            system:"You are a traditional Defi agent which has access to various information about decentralized finance, use it and work your best"
    })
    console.log(JSON.stringify(result.response.body, null, 2));
    // {
    //     "id": "msg_01T3pJh76uo5BQD8KSLWZPUe",
    //     "type": "message",
    //     "role": "assistant",
    //     "model": "claude-3-5-sonnet-20241022",
    //     "content": [
    //       {
    //         "type": "text",
    //         "text": "I apologize, but I don't have access to real-time price data. USDC (USD Coin) is designed to maintain a stable 1:1 peg with the US Dollar, so its price should theoretically always be very close to $1.00. However, there can be slight variations due to market conditions.\n\nTo get the current exact price of USDC on Ethereum, you can:\n\n1. Check popular cryptocurrency exchanges like Coinbase, Binance, or Uniswap\n2. Use price aggregators like CoinGecko or CoinMarketCap\n3. Look at DeFi dashboards like DeBank or Zapper\n\nThese sources will give you the most up-to-date and accurate price information for USDC on Ethereum."
    //       }
    //     ],
    //     "stop_reason": "end_turn",
    //     "stop_sequence": null,
    //     "usage": {
    //       "input_tokens": 42,
    //       "cache_creation_input_tokens": 0,
    //       "cache_read_input_tokens": 0,
    //       "output_tokens": 176
    //     }
    //   }

    return res.send({
        message:result.text
    })
    }catch(err){

    }
   
  });

app.post("/agent", async (req:Request, res:Response):Promise<any> =>{
    try{
        const result=await chatFunction(req.body.messages, req.body.address);
        console.log(result,"The result of the agent is")
        return res.send({
            message:result
        })
    }catch(err){
        console.log(err,"Faced this error")
        return res.status(500).send({
            message:"Couldnt initialise the agent"
        })
    }
})

app.get("/volatile", async (req: Request, res: Response) => {
  try {
    const supportedTokens = [
      { token_address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7" }, // ETH
      { token_address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8" }, // USDC
      { token_address: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8" }, // USDT
      // Add more tokens as needed
    ];
    
    const formattedTokens = supportedTokens.map((item) => {
      const chainName = "starknet";
      return `${chainName}:${item.token_address}`;
    }).join(",");
  
    // Using the correct API domain provided
    const apiUrl = `https://coins.llama.fi/percentage/${formattedTokens}`;
    
    // Extract query parameters from the request
    const { timestamp, lookForward, period } = req.query;

    // Build query parameters for the API call
    const queryParams = new URLSearchParams();

    if (timestamp) {
      queryParams.append("timestamp", timestamp as string);
    }

    if (lookForward !== undefined) {
      queryParams.append("lookForward", lookForward as string);
    }

    if (period) {
      queryParams.append("period", period as string);
    }

    // Construct the full URL with query params
    const queryString = queryParams.toString();
    const fullApiUrl = `${apiUrl}${queryString ? `?${queryString}` : ''}`;
    
    // Make the API call to DeFiLlama
    const response = await axios.get(fullApiUrl);
    
    // Check if the request was successful
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }      
    const data = response.data;
    console.log("Data from DeFiLlama:", data);
    
    // Send the data as the response
    res.json(data);
  } catch (error) {
    console.error("Error in /volatile endpoint:", error);
    res.status(500).json({ 
      error: "Failed to fetch token price changes",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});



app.listen(`${PORT}`, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
  
  
  