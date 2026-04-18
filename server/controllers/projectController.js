const project = require("../models/project");
const user = require("../models/user");

const createProject = async (req, res) => {
    
    const {name, description} = req.body;
    if(!name || !description){
        return res.status(400).json({message: "All fields are required"});
    }

    try {
    const proj = await project.create({
        name,
        description,
        admin:req.user._id
    })

    proj.members.push(req.user._id);
    await proj.save();

    return res.status(201).json({message: "Project created successfully", proj});
    } catch (error) {
        next(error);
    }
}


const addMember = async (req, res, next) =>{
	try{
        const { projectId } = req.params;
		const proj = await project.findById(projectId);
		if(!proj){ return res.status(404).json({message:"Project not found"});}
		
		if(proj.admin.toString() !== req.user._id.toString()){
            return res.status(403).json({message:"Only Admin can add members"});
		}

        const {email} = req.body;
        const userExist = await user.findOne({email});
        if(!userExist){ return res.status(404).json({message:"User not found with this email"});}

        if(proj.members.find((member) => member.toString() === userExist._id.toString())){
            return res.status(400).json({message:"User is already a member"});
        }

        proj.members.push(userExist._id);
        await proj.save();
        return res.status(200).json({message:"Member added successfully", proj});
	} catch(err){
        next(err);
	}
}

const getAllProjects = async (req,res,next)=>{
    try {
        const projects = await project.find({ 
            members: req.user._id 
        }).sort({ createdAt: -1 });
        return res.status(200).json({projects});

    } catch (error) {
        next(error);
    }
}

const getprojectDetails = async (req, res, next) =>{
    try {
        const {projectId} = req.params;
        const projectExist = await project.findById(projectId).populate("members", "name email");
        if(!projectExist) return res.status(404).json({message:"Project not found"});

        return res.status(200).json(projectExist);
        
    } catch (error) {
        next(error);
    }
}


module.exports = {createProject, addMember, getAllProjects, getprojectDetails};