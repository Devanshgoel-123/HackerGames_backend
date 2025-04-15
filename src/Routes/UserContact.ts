import express, { Router } from "express";
import { Request,Response } from "express";
import { AddUserContact } from "../Functions/UserContacts";
import { prisma } from "../db";
export const UserContactRouter:Router=express.Router();



UserContactRouter.post("/save",async (req:Request, res:Response):Promise<any>=>{
    try{
        const {
            userAddress,
            contactAddress,
            name
        }=req.body;
        const result=await AddUserContact({
            userAddress,
            name,
            contactAddress
        })
        return res.send({
            message:result
        });
    }catch(err){
        console.log("error saving the contact of the user",err)
        res.status(500).send({
            message:'Error saving the user contact'
        })
    }
})

UserContactRouter.get("/contacts",async (req:Request, res:Response):Promise<any>=>{
    try{
        const {
            userAddress
        }=req.query;
        const userId=await prisma.user.findUnique({
            where:{
                walletAddress:userAddress?.toString()
            }
        })
        if(userId===null){
            return res.send({
                success:true,
                result:[],
                message:'User not registered'
            })
        }
        const result=await prisma.userContact.findMany({
            where:{
                userId:userId.id
            }
        })
        return res.send({
            success:true,
            message:"Found contacts successfully",
            result:result
        })
    }catch(err){
        console.log("Error fetching the contacts for the user",err)
        return res.send({
            success:false,
            message:"Found no contacts for the user",
            result:[]
        })
    }
})