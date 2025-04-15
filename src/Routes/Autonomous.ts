import { Router } from "express";
import axios from "axios";
import express from "express";
import { Request,Response } from "express";
import { fetchTransactionByAgent, MakeDepositToAgent } from "../Functions/Autonomous";


export const AutonomousRouter:Router=express.Router();

AutonomousRouter.post("/createDeposit",async (req:Request, res:Response):Promise<any>=>{
    try{
     const { agentWallet, userWallet, amount, stopLoss, expectedProfit} = req.body;
     const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7)
     const {message, success,data} = await MakeDepositToAgent({
        agentWallet: agentWallet,
        userWallet : userWallet,
        amount : amount,
        stopLoss : stopLoss,
        expectedProfit,
        deadline
     });
    return res.status(200).send({
            message:message,
            success:success,
            data:data
    })
    }catch(err){
        console.log(err)
        return res.status(500).send({
            message:"error creating deposit to the agent wallet"
        })
    }
})

AutonomousRouter.get("/getTransactionsByAgent",async (req:Request, res:Response):Promise<any>=>{
    try{
        const {
            agentWalletAddress
        }=req.query;
        if(agentWalletAddress===undefined){
            return res.status(400).send({
                status:true,
                message:"Please provide the correct agent address"
            })
        }
        const result=await fetchTransactionByAgent(agentWalletAddress.toString())
        return res.send({
            status:true,
            message:result
        })
    }catch(err){

    }
})