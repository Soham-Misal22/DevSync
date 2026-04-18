import API from './api';

export const getProjectSnippets = async (projectId) => {
    const { data } = await API.get(`/snippet/${projectId}`);
    return data.snippets;
};

export const createSnippet = async (snippetData) => {
    const { data } = await API.post(`/snippet/${snippetData.project}/create`, snippetData);
    return data;
};

export const deleteSnippet = async (snippetId) => {
    const { data } = await API.delete(`/snippet/${snippetId}`);
    return data;
};

export const explainSnippet = async (snippetData) => {
    const { data } = await API.post('/ai/explain', snippetData);
    return data;
};
