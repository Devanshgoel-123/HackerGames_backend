import express, { Router } from "express";
import { Request,Response } from "express";
import { AddUserContact } from "../Functions/UserContacts";

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