import API from './api';

const getProjects = async () => {
    const { data } = await API.get('/project');
    return data.projects; 
};

const createProject = async (projectData) => {
    const { data } = await API.post('/project/create', projectData);
    return data;
};

const getProjectDetails = async (projectId) => {
    const {data} = await API.get(`/project/${projectId}`);
    return data;
}

const getProjectTasks = async (projectId) => {
    const { data } = await API.get(`/task/${projectId}`);
    return data;
};

const addMember = async (projectId, email) => {
    const { data } = await API.post(`/project/${projectId}/add-member`, { email });
    return data;
};

export {getProjects, createProject, getProjectDetails, getProjectTasks, addMember};

