import { useContext } from 'react';
import { AuthContext } from '../context/authContext';
import { Link } from 'react-router-dom';
import { LogOut, Home, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        logout();
        toast.success("Successfully logged out!");
    };

    if (!user) return null;

    return (
        <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                            DevSync
                        </Link>
                        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">
                            <Home size={18} /> Home
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-gray-300">
                            <div className="bg-gray-800 p-1.5 rounded-full border border-gray-700">
                                <User size={16} className="text-blue-400" />
                            </div>
                            <span className="text-sm font-medium hidden sm:block">{user?.name || user?.email}</span>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-red-400 transition-colors bg-gray-800/50 hover:bg-gray-800 px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-700"
                        >
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
