
import { prisma } from "../db"

interface Input{
    userAddress:string;
    name:string;
    contactAddress:string
}


export const AddUserContact= async (input:Input)=>{
    try{
        const {
            userAddress,
            name,
            contactAddress
        }=input;
        if(userAddress==="" || name==="" || contactAddress===""){
            return { 
                success: false,
                data: `Missing the parameters`
            }
        }
        let userId: number;
        let existingUser = await prisma.user.findFirst({
            where: {
                walletAddress: userAddress
            }
        });
        if (existingUser === null) {
            const newUser = await prisma.user.create({
                data: {
                    walletAddress: userAddress,
                }
            });
            userId = newUser.id;
        } else {
            userId = existingUser.id;
        }
        const result = await prisma.userContact.create({
            data: {
                userId: userId,
                name: name,
                address: contactAddress
            }
        });
        return { success: true, data: result };
    }catch(err){
        console.log("Error inserting contacts into the Database",err)
    }
}