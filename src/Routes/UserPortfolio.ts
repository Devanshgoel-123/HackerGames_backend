import axios from "axios";
import express from "express";
import dotenv from "dotenv";
import { Request,Response } from "express";
import { fetchUserPortfolio } from "../Functions/Portfolio";
import { prisma } from "../db";
dotenv.config()

export const UserPortfolioRouter=express.Router();

UserPortfolioRouter.get("/",async (req:Request,res:Response):Promise<any>=>{
    try{ 
        const {
            agentWalletAddress,
        }=req.query;
        console.log("the agent wallet Address is:",agentWalletAddress)
        if(agentWalletAddress==="" || agentWalletAddress===undefined) return res.send({
            data:"Please connect your wallet"
        })
        const userPortfolio=await fetchUserPortfolio(agentWalletAddress.toString())
        console.log("the user portfolio is",userPortfolio);
	    return res.json({
        userPortfolio,
	  });
    }catch(err){
        console.log("error fetching user portfolio",err)
        return res.status(500).json({
            message:"Error fetching the user portfolio"
        })
    }
})

UserPortfolioRouter.get("/agentTotal",async (req:Request,res:Response):Promise<any>=>{
    try{ 
        const {
            agentWalletAddress,
        }=req.query;
        console.log("the agent wallet Address is:",agentWalletAddress)
        if (!agentWalletAddress) {
            return res.status(400).json({ data: "Please connect your wallet" });
        }
        let totalAmount=0;
        let stopLoss=0;
        const deposit=await prisma.deposit.findMany({
            where:{
                agentWallet:agentWalletAddress.toString()
            }
        })
        deposit.forEach((item) => {
            totalAmount += Number(item.amount);
            stopLoss += Number(item.stopLoss);
          });
        const userPortfolio=await fetchUserPortfolio(agentWalletAddress.toString())
        const totalHoldings=userPortfolio.total_value_usd
        console.log("the user portfolio is",userPortfolio);
	    return res.json({
            totalAmount:totalAmount,
            stopLoss:stopLoss,
            totalHoldings:totalHoldings
	  });
    }catch(err){
        console.log("error fetching user portfolio",err)
        return res.status(500).json({
            message:"Error fetching the user portfolio"
        })
    }
})