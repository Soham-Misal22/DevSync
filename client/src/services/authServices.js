import API from "./api";

const loginUser = async (user) => {

    const response = await API.post('/auth/login', user);

    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
}

const registerUser = async (user) => {
    const response = await API.post('/auth/register', user);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
}

export { loginUser, registerUser }; 