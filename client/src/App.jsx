import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/authContext';
import Login from './pages/login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="bg-gray-900 h-screen"></div>; // Simple splash

  return (
    <>
      <Toaster position="bottom-right" toastOptions={{
        style: { background: '#333', color: '#fff' }
      }}/>
      {user && <Navbar />}
      <div className={user ? "bg-gray-900 min-h-[calc(100vh-64px)]" : "bg-gray-900 min-h-screen"}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path='/register' element= {!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/project/:id" element={user ? <ProjectDetails /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </>
  );
}

// Simple temporary Dashboard component
// const Dashboard = () => {
//   const { logout, user } = useContext(AuthContext);
//   return (
//     <div className="p-8 bg-gray-900 h-screen text-white">
//       <h1>Welcome, {user.name}!</h1>
//       <button onClick={logout} className="mt-4 bg-red-500 px-4 py-2 rounded">Logout</button>
//     </div>
//   );
// };

export default App;