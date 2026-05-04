import API from './api';

export const getProjectSnapshots = async (projectId) => {
    const { data } = await API.get(`/snapshot/${projectId}`);
    return data;
};

export const createSnapshot = async (projectId, snapshotData) => {
    const { data } = await API.post(`/snapshot/${projectId}`, snapshotData);
    return data;
};
