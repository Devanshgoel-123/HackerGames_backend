import { Router } from "express";
import axios from "axios";
import express from "express";
import { Request,Response } from "express";
import { DepositWithdrawPool } from "../types/defi";
import { DepositFunctionStrkFarm } from "../Functions/StrkFarm";
import { DepositWithdrawAgentFunction } from "../Agents/deposit_withdrawal_Service";
import dotenv from "dotenv";
dotenv.config();
export const DepositWithdrawRouter=express.Router();




DepositWithdrawRouter.get("/pools",async (req:Request, res:Response):Promise<any>=>{
    try{
        return res.send({
            data:DEPOSIT_WITHDRAW
        })
    }catch(err){
        console.log("Error fetching the pools data",err)
    }
})

DepositWithdrawRouter.post("/deposit",async(req:Request,res:Response):Promise<any>=>{
    try{
        const {
            tokenName,
            amount,
            accountAddress,
            protocolName
        }=req.body;

        if(protocolName==="StrkFarm"){
            const result=await DepositFunctionStrkFarm(tokenName,amount,accountAddress);
        }else{

        }
    }catch(err){
        console.log("Error depositing inside the contract",err)
    }
})


DepositWithdrawRouter.post("/agent",async(req:Request,res:Response):Promise<any>=>{
    try{
		const result=await DepositWithdrawAgentFunction(req.body.messages, req.body.address);
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



export const DEPOSIT_WITHDRAW:DepositWithdrawPool[]=[
	{
	tokenImage:"https://media-hosting.imagekit.io/80e1e56fa0c943c7/usdc_new.png?Expires=1839217737&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=qXvClgWu67vLyWr7aqcLSbieKj5v6I3Vs2-Sq3U1OJJJgb~0tfcbba1E~hbqOfQtdRRJs3s~yGjhFQ59cZCrjJ0SrWCBAL2t~~fZBaBXwrdEU3PuW8o6Il~zGRB~RYmJ54pY6Ok0OmjBA0NjqHlK4ghEvk9PlHTZQBMenhIlS5wn2pcry6XLU2eA8KypE2lQnBOGa2~PsZGsizrLQHXrWk43v5ml10tVUTXJicKzvM5sojgLRUKDYdC03MCxqn1ocKpE4dZ~WvDu8FVA4YSQwoaPY~vumlRPkMIRVnu5luzF0YIYuwUqbNbeeuWu2wZRf59CnCZ573~brIqHvH7neA__",
	tokenName:"usdc",
	protocol:"StrkFarm",
	protocolImage:"https://media-hosting.imagekit.io/28ed5a918f04418d/strkfarm.png?Expires=1839292803&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=yTXhvMeOZo7bk1Q4AS2F-2XOJwfoynPtGBfWcJC75Q21Q~WJksSS4zK6SCriExToZC3JkjESaoEQB0AwYS1DFZosfxx-e2dktOp7scCH52J-cu28IsnCjy1wfCnSWI5CXGi-hZxBwqOI8VcTcwvxZ4FYrmRMOaeBpygYCahpgA32FIUT1Jlp6GngEeKvBl9oDDa1TuNgdHNoIau--x-6L7vPjHucS3FhXuTLni5WEk301fO-D3H0-Vx0SIzanW7N3Sqifb~NnmodNGwQg0bhXVnPDSF4vVflhFf4BC1ppfGKGlI-IHEQp8KSnzO~416oD9FTHm936jBMcCWKqDAaBg__",
	contractAddress:'0x00a858c97e9454f407d1bd7c57472fc8d8d8449a777c822b41d18e387816f29c',
	feature1:"Deposit",
	feature2:"Withdraw",
	poolName:"Vesu Fusion USDC vfUSDC",
	apy:"5.94%"
	},
	{
	 tokenImage:"https://media-hosting.imagekit.io/833bebb3e1304880/usdt.svg?Expires=1839217485&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=QrpbcbbQEboGDiRXWgAPN2U-jAybSqvU6hKuZJ0S8U~5CryBI6sBy7azuPLQWHfu0UlpucTiB5plr8NmMPX6sw3daiGmUpb7RTZjSwKMHq2O1i6YSe4t3dHHyFFvAvIjiE9Egb-Cqg3-PVFvo4TEkmK7zo-Rh3eE6vMsgT~Lj9osoThVJSalKI7pRkXhUomiErYjd0nKm-YGmuRNDaw69eRFSkoPWO~NJBqJ7fmdlmC4hEmuv6r0rc~07M1HNU1VSsjrsv6bBKTSt17g1YH7BYa43WUBy~~Mv3ByQrtVNu0FuM2Y3CmqTpCYZjO0TUvYwnRLnzQiwrVem8jBzIbpuA__",
	 tokenName:"usdt",
	 protocol:"StrkFarm",
	 protocolImage:"https://media-hosting.imagekit.io/28ed5a918f04418d/strkfarm.png?Expires=1839292803&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=yTXhvMeOZo7bk1Q4AS2F-2XOJwfoynPtGBfWcJC75Q21Q~WJksSS4zK6SCriExToZC3JkjESaoEQB0AwYS1DFZosfxx-e2dktOp7scCH52J-cu28IsnCjy1wfCnSWI5CXGi-hZxBwqOI8VcTcwvxZ4FYrmRMOaeBpygYCahpgA32FIUT1Jlp6GngEeKvBl9oDDa1TuNgdHNoIau--x-6L7vPjHucS3FhXuTLni5WEk301fO-D3H0-Vx0SIzanW7N3Sqifb~NnmodNGwQg0bhXVnPDSF4vVflhFf4BC1ppfGKGlI-IHEQp8KSnzO~416oD9FTHm936jBMcCWKqDAaBg__",
	 contractAddress:'0x0115e94e722cfc4c77a2f15c4aefb0928c1c0029e5a57570df24c650cb7cec2c',
	 feature1:"Deposit",
	 feature2:"Withdraw",
	 poolName:"Vesu Fusion USDT vfUSDT",
	 apy:"3.43%"
	},
	{
	tokenImage:"https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
	tokenName:"Eth",
	protocol:"StrkFarm",
	protocolImage:"https://media-hosting.imagekit.io/28ed5a918f04418d/strkfarm.png?Expires=1839292803&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=yTXhvMeOZo7bk1Q4AS2F-2XOJwfoynPtGBfWcJC75Q21Q~WJksSS4zK6SCriExToZC3JkjESaoEQB0AwYS1DFZosfxx-e2dktOp7scCH52J-cu28IsnCjy1wfCnSWI5CXGi-hZxBwqOI8VcTcwvxZ4FYrmRMOaeBpygYCahpgA32FIUT1Jlp6GngEeKvBl9oDDa1TuNgdHNoIau--x-6L7vPjHucS3FhXuTLni5WEk301fO-D3H0-Vx0SIzanW7N3Sqifb~NnmodNGwQg0bhXVnPDSF4vVflhFf4BC1ppfGKGlI-IHEQp8KSnzO~416oD9FTHm936jBMcCWKqDAaBg__",
	contractAddress:'0x05eaf5ee75231cecf79921ff8ded4b5ffe96be718bcb3daf206690ad1a9ad0ca',
	feature1:"Deposit",
	feature2:"Withdraw",
	poolName:"Vesu Fusion ETH vfETH",
	apy:"4.73%"
	},
	{
	tokenImage:"https://assets.coingecko.com/coins/images/26433/small/starknet.png",
	tokenName:"Strk",
	protocol:"StrkFarm",
	protocolImage:"https://media-hosting.imagekit.io/28ed5a918f04418d/strkfarm.png?Expires=1839292803&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=yTXhvMeOZo7bk1Q4AS2F-2XOJwfoynPtGBfWcJC75Q21Q~WJksSS4zK6SCriExToZC3JkjESaoEQB0AwYS1DFZosfxx-e2dktOp7scCH52J-cu28IsnCjy1wfCnSWI5CXGi-hZxBwqOI8VcTcwvxZ4FYrmRMOaeBpygYCahpgA32FIUT1Jlp6GngEeKvBl9oDDa1TuNgdHNoIau--x-6L7vPjHucS3FhXuTLni5WEk301fO-D3H0-Vx0SIzanW7N3Sqifb~NnmodNGwQg0bhXVnPDSF4vVflhFf4BC1ppfGKGlI-IHEQp8KSnzO~416oD9FTHm936jBMcCWKqDAaBg__",
	
	contractAddress:'0x07fb5bcb8525954a60fde4e8fb8220477696ce7117ef264775a1770e23571929',
	feature1:"Deposit",
	feature2:"Withdraw",
	poolName:"Vesu Fusion STRK vfSTRK",
	apy:"10.92%"
	},
	{
	tokenImage:"https://media-hosting.imagekit.io/80e1e56fa0c943c7/usdc_new.png?Expires=1839217737&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=qXvClgWu67vLyWr7aqcLSbieKj5v6I3Vs2-Sq3U1OJJJgb~0tfcbba1E~hbqOfQtdRRJs3s~yGjhFQ59cZCrjJ0SrWCBAL2t~~fZBaBXwrdEU3PuW8o6Il~zGRB~RYmJ54pY6Ok0OmjBA0NjqHlK4ghEvk9PlHTZQBMenhIlS5wn2pcry6XLU2eA8KypE2lQnBOGa2~PsZGsizrLQHXrWk43v5ml10tVUTXJicKzvM5sojgLRUKDYdC03MCxqn1ocKpE4dZ~WvDu8FVA4YSQwoaPY~vumlRPkMIRVnu5luzF0YIYuwUqbNbeeuWu2wZRf59CnCZ573~brIqHvH7neA__",
	tokenName:"xSTRK",
	protocol:"EndurFi",
	protocolImage:"https://media-hosting.imagekit.io/717c613603294f66/endurfi.jpg?Expires=1839293326&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=jsaEPPIEowaNIKGTMYT~b7bIF5odTVjpoC2VD5kOFY~qiwlGSoA9sRvyiQ83SGuZlUPKckHn~9WHSn9yBLfzKSiNnmOU2BtFra5qaStqHF8KX80f5jb2vQI8Lr~YftSe5Qu9A6nfI0MLnxMGxrpP8XczqH57pwJMpYSa4az4WVTKxX~XZA1Vof99Gd7vtJBMatG-mHlYZDZ1xeY0NgD0J6lF4VCj8iglMgOhvjAIQtvzI08mJwheZKWffh63M7SHBdpy2pZxb8vwH2jYe-5vazxqpqnVUavP4uZlI1I9aVXRbVjWDiTLBXwpzvbJgSOLnv8ShndLlV-wUvDRg0KgAw__",
	contractAddress:'0x28d709c875c0ceac3dce7065bec5328186dc89fe254527084d1689910954b0a',
	feature1:"Deposit",
	feature2:"Withdraw",
	poolName:"Endur xSTRK xSTRK",
	apy:"11.40%"
	}
]
