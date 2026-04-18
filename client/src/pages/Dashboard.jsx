import { useEffect, useState } from 'react';
import { getProjects, createProject } from '../services/projectServices';
import { Plus, Layout, Users, ChevronRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Skeleton from '../components/Skeleton';

const Dashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });

    const fetchProjects = async () => {
        try {
            const data = await getProjects();
            setProjects(data);
        } catch (err) {
            console.error("Error fetching projects", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await createProject(newProject);
            setIsModalOpen(false); // Close modal
            setNewProject({ name: '', description: '' }); // Reset form
            fetchProjects(); // Refresh the list
            toast.success("Project created successfully!");
        } catch (err) {
            toast.error("Failed to create project");
        }
    };

    if (loading) return <div className="p-8 max-w-6xl mx-auto"><Skeleton lines={3} /></div>;

    return (
        <div className="p-8 text-white relative">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold">My Projects</h1>
                        <p className="text-gray-400 mt-1">Manage your developer workspaces</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg"
                    >
                        <Plus size={20} /> New Project
                    </button>
                </div>

                {/* Project Grid (Same as before) */}
                {projects.length === 0 ? (
                    <div className="text-center py-20 bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-700">
                        <Layout className="mx-auto text-gray-600 mb-4" size={48} />
                        <p className="text-gray-400">No projects found. Create your first workspace!</p>
                    </div>
                ) : (
                    <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <Link to={`/project/${project._id}`} key={project._id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500/50 transition-all group flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-500/10 p-3 rounded-lg text-blue-500"><Layout size={24} /></div>
                                    <ChevronRight className="text-gray-600 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                                <p className="text-gray-400 text-sm line-clamp-2 mb-4">{project.description}</p>
                                <div className="mt-auto flex items-center gap-2 text-gray-500 text-xs">
                                    <Users size={14} />
                                    <span>{project.members?.length || 0} Members</span>
                                </div>
                            </Link>
                        ))}
                    </div>

                )}
            </div>

            {/* --- CREATE PROJECT MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border border-gray-700 w-full max-w-md rounded-2xl p-8 shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6">Create New Workspace</h2>

                        <form onSubmit={handleCreateProject} className="space-y-5">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Project Name</label>
                                <input
                                    type="text" required
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:border-blue-500 outline-none"
                                    placeholder="e.g. Marathi Font Converter"
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Description</label>
                                <textarea
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2.5 px-4 text-white focus:border-blue-500 outline-none h-32"
                                    placeholder="What is this project about?"
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                ></textarea>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
                                Create Project
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;