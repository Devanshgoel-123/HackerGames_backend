import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser = require("body-parser");
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"


dotenv.config()
const app: Express = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.listen(`${PORT}`, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
  
  
  