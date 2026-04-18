import API from './api';

export const getVaultItems = async (projectId) => {
    const { data } = await API.get(`/vault/${projectId}`);
    return data.vaultItems; // Matching your backend response structure
};

export const addVaultItem = async (projectId, vaultData) => {
    const { data } = await API.post(`/vault/${projectId}/create`, vaultData);
    return data;
};