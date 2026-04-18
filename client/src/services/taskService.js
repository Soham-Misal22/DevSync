import API from './api';

export const getProjectTasks = async (projectId) => {
    const { data } = await API.get(`/task/${projectId}`);
    return data.tasks;
};

export const createTask = async (projectId, taskData) => {
    const { data } = await API.post(`/task/create/${projectId}`, taskData);
    return data;
};

export const updateTaskStatus = async (taskId, status) => {
    const { data } = await API.patch(`/task/${taskId}/status`, { status });
    return data;
};

export const deleteTask = async (taskId) => {
    const { data } = await API.delete(`/task/${taskId}`);
    return data;
};

export const generateTasksWithAI = async (goal) => {
    const { data } = await API.post('/ai/generate-tasks', { goal });
    return data.tasks;
};

export const editTask = async (taskId, updateData) => {
    const { data } = await API.patch(`/task/${taskId}`, updateData);
    return data;
};