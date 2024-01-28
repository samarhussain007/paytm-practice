const express = require("express");
const { authMiddleware } = require("../middlewares/middleware");
const { User, Account } = require("../db");
const { default: mongoose } = require("mongoose");

const accountRouter = express.Router();

accountRouter.use(authMiddleware);

async function accountInfo(userName) {
    const user = await User.findOne({userName:userName});
    req.accountId = user.account;
    const account = await Account.findOne({_id: req.accountId});
    return account;
}

accountRouter.get("/balance", async(req,res)=>{

    const account = accountInfo(req.userName);
    res.json({
        balance: account.balance,
    })
})

accountRouter.post("/transfer", async (req,res)=>{
    const session = await mongoose.startSession();
    const senderAccount = await accountInfo(req.userName);
    const {receiver,amount} =  req.body;
    const decimalAmount = amount*100;
    const receiverAccount = await accountInfo(receiver);

    if(!senderAccount || !receiverAccount){
        res.status(404).json({
            msg: "Account not found"
        })
    }

    if(senderAccount.balance < decimalAmount){
        res.status(404).json({
            msg: "Insufficent Account Balance"
        })
    }

    await session.startTransaction()

    senderAccount.balance-=decimalAmount;
    receiverAccount.balance -= decimalAmount;

    try {
        await senderAccount.save();
        await receiverAccount.save();
        await session.commitTransaction();
        res.json({
            msg:"Transfer Complete",
        })

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            msg: "Could not complete Transaction"
        })
    }
    finally{
        await session.endSession();
    }

})

module.exports = accountRouter;