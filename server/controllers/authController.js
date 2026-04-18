const user = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");



const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const userExists = await user.findOne({email});

        if(userExists){
            return res.status(400).json({message: "User already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const newUser = await user.create({
            name,
            email,
            password: hash
        })

        return res.status(201).json({message: "User registered successfully"})


    } catch (error) {
        next(error);
    }
}

const loginUser = async(req,res) => {
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({ message: "All fields are required"})
        }
        
        const userExists = await user.findOne({email})
        if(!userExists){
            return res.status(400).json({message: "Invalid credentials"})
        }

        const isPasswordValid = await bcrypt.compare(password, userExists.password)
        if(!isPasswordValid){
            return res.status(400).json({message: "Invalid credentials"})
        }
        
        const token = jwt.sign({id: userExists._id}, process.env.JWT_SECRET, {expiresIn: "30d"})

        return res.status(200).json({message: "User logged in successfully", token, user: userExists})
        

    } catch(error){
        next(error);
    }
}


const getUserProfile = async(req,res) =>{
    return res.status(200).json({message: "User profile", user: req.user})
}

module.exports = {registerUser, loginUser, getUserProfile}