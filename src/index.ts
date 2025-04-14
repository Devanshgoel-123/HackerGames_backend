import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser = require("body-parser");
import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { chatFunction } from "./Agents/agentService";
import { UserPortfolioRouter } from "./Routes/UserPortfolio";
import { RebalancePortfolioRouter } from "./Routes/RebalancingPortfolio";
import { FetchVolatileTokens } from "./Functions/FetchVolatileTokens";
import { DepositFunction } from "./Functions/StrkFarm";
import { CronJob, CronTime } from 'cron';
import { RebalancerReusableFunction } from "./Functions/Portfolio";
import { prisma } from "./db";
import { UserContactRouter } from "./Routes/UserContact";
import { AutonomousRouter } from "./Routes/Autonomous";
dotenv.config()
const app: Express = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/userPortfolio",UserPortfolioRouter);
app.use("/autonomous",AutonomousRouter);
app.use("/rebalance",RebalancePortfolioRouter);
app.use("/userContact",UserContactRouter);
const PORT = process.env.PORT || 3002;



const rebalancerJob=new CronJob(
     '0 0 */6 * * *',
     async function(){
      console.log("🔄 Running rebalancer job...");
      const UserPreference=await prisma.userPortfolioPreference.findMany();
      await Promise.all(UserPreference.map(async (item)=>{
        await RebalancerReusableFunction(
          item.StablePercentage,
          item.NativePercentage,
          item.OtherPercentage,
          item.walletAddress
        ); 
      }))
      console.log("✅ Rebalancer job completed.");  
     },
     ()=>{
      console.log("Ran the rebalance function")
     },
	  true,
	'Asia/Kolkata'
)





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
    const result= await FetchVolatileTokens();
    res.json({
        data:result?.volatileTokensData
    });
  } catch (error) {
    console.error("Error in /volatile endpoint:", error);
    res.status(500).json({ 
      error: "Failed to fetch token price changes",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.post('/depositStrkFarm',async (req: Request, res: Response) => {
  try {
    const {
      tokenName,
      amount,
      accountAddress,
    }=req.body;
    const result= await DepositFunction(tokenName,amount,accountAddress)
    console.log(result)
    res.json({
        data:"Hello deposit successfully"
    });
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
  

