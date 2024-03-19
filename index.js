import express from "express"
import dotenv from "dotenv"
dotenv.config()
import mongoose from "mongoose"
import cors from "cors"
import { UserRouter } from "./routes/user.js"
import cookieParser from "cookie-parser"


const app=express()
app.use(express.json())
app.use(cors({
    origin:["http://localhost:5173"],
    credentials:true
}))
app.use(cookieParser())

app.get("/",async(req,res)=>
{
    res.send("landed correctly")
})
app.use("/auth",UserRouter)


const PORT=process.env.PORT

mongoose.connect("mongodb://127.0.0.1:27017/authentication")


app.listen(PORT,()=>{
    console.log(`server is running on ${PORT}`)
})