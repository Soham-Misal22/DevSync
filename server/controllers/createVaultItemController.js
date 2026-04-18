const cryptoJS = require("crypto-js");
const vault = require("../models/vault");
const project = require("../models/project");


const createVaultItem = async (req, res, next) => {
    try {
        const {projectId} = req.params;
        const {keyName, secretValue} = req.body;
        
        if(!keyName || !secretValue){
            return res.status(400).json({message: "All fields are required"});
        }

        const projectExists = await project.findById(projectId);
        if(!projectExists){
            return res.status(404).json({message: "Project not found"});
        }

        if(projectExists.admin.toString() !== req.user._id.toString()){
            return res.status(403).json({message: "Only Admin can add secrets"});
        }

        const encryptedValue = cryptoJS.AES.encrypt(secretValue, process.env.SECRET_KEY).toString();

        const vaultItem = await vault.create({keyName, secretValue: encryptedValue, project: projectId, createdBy: req.user._id});
        return res.status(201).json({message: "Vault item created successfully", vaultItem});   

    } catch (error) {
        next(error);
    }
}


const getVaultItems = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        // 1. Fetch Project to check membership
        const projectData = await project.findById(projectId);
        if (!projectData) {
            return res.status(404).json({ message: "Project not found" });
        }

        // 2. Check if the logged-in user is a member
        if (!projectData.members.some(member => member.toString() === req.user._id.toString())) {
            return res.status(403).json({ message: "Access denied" });
        }

        // 3. Get items as plain JavaScript objects using .lean()
        const vaultItems = await vault.find({ project: projectId }).lean();

        // 4. Decrypt inside map
        const decryptedVaultItems = vaultItems.map((item) => {
            const bytes = cryptoJS.AES.decrypt(item.secretValue, process.env.SECRET_KEY);
            const originalValue = bytes.toString(cryptoJS.enc.Utf8);
            
            return {
                ...item,
                secretValue: originalValue // Overwrite the encrypted string with plain text
            };
        });

        return res.status(200).json({ 
            message: "Vault items decrypted successfully", 
            vaultItems: decryptedVaultItems 
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {createVaultItem, getVaultItems}