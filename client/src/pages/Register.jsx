import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/authContext';
import { registerUser } from '../services/authServices';
import { User, Mail, Lock } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const { setUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await registerUser(formData);
            setUser(data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl p-8 border border-gray-700">
                <h2 className="text-3xl font-bold text-white text-center mb-2">Create Account</h2>
                <p className="text-gray-400 text-center mb-8">Join the developer workspace</p>
                
                {error && <p className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-gray-500" size={20} />
                            <input 
                                type="text" required
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-blue-500 outline-none"
                                placeholder="Abhijit Patil"
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
                            <input 
                                type="email" required
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-blue-500 outline-none"
                                placeholder="name@vit.edu"
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
                            <input 
                                type="password" required
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-blue-500 outline-none"
                                placeholder="••••••••"
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-blue-900/20">
                        Create Account
                    </button>
                </form>

                <p className="text-gray-400 text-center mt-6 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-500 hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;