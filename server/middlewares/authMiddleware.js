const jwt = require("jsonwebtoken");
const user = require("../models/user");

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).json({message: "Unauthorized"})
    }
    //code to check if header starts with "Bearer "
    if(!authHeader.startsWith("Bearer ")){
        return res.status(401).json({message: "Unauthorized"})
    }
    const token = authHeader.split(" ")[1];
    if(!token){
        return res.status(401).json({message: "Unauthorized"})
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const finduser = await user.findOne({_id: decodedToken.id})
        if(!finduser){
            return res.status(401).json({message: "Unauthorized"})
        }
        req.user = finduser;
        next();
    } catch (error) {
        return res.status(401).json({message: "Unauthorized"})  
    }
}

module.exports = {protect}