import axios from "axios";
import express from "express";
import dotenv from "dotenv";
import { Request,Response } from "express";
import { RebalancerReusableFunction } from "../Functions/Portfolio";

dotenv.config()

export const RebalancePortfolioRouter=express.Router();


RebalancePortfolioRouter.post("/",async (req:Request,res:Response):Promise<any>=>{
    try{ 
        const {
            agentWalletAddress,
            stable,
            native,
            other
        }=req.body;
        console.log("the agent wallet Address is:",agentWalletAddress)
        if(agentWalletAddress==="" || agentWalletAddress===undefined) return res.send({
            data:"Please connect your wallet"
        })
        const requiredSwaps=await RebalancerReusableFunction(stable, native, other, agentWalletAddress)
        return res.send(requiredSwaps);
    }catch(err){
        console.log("error fetching user portfolio",err)
        return res.status(500).json({
            message:"Error fetching the user portfolio"
        })
    }
})