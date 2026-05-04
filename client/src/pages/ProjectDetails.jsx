import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectDetails, addMember } from '../services/projectServices';
import { ClipboardList, ShieldCheck, Code2, Users, UserPlus, Terminal } from 'lucide-react';
import Vault from '../components/Vault';
import Tasks from '../components/Tasks';
import Snippets from '../components/Snippets';
import LiveWorkspace from '../components/LiveWorkspace';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState('tasks');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await getProjectDetails(id);
                setProject(data);
            } catch (err) {
                toast.error("Failed to load project details");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleAddMember = async () => {
        const email = prompt("Enter the email of the team member:");
        if (!email) return;

        try {
            await addMember(id, email);
            toast.success("Member added successfully!");
            
            // Refresh project data so the new member shows up in the 'members' array
            const updatedProject = await getProjectDetails(id);
            setProject(updatedProject);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add member");
        }
    };

    if (isLoading) return <div className="p-8 max-w-6xl mx-auto"><Skeleton lines={4} /></div>;
    if (!project) return <div className="p-8 text-center text-gray-500">Project not found.</div>;

    return (
        <div className="text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Project Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{project.name}</h1>
                        <p className="text-gray-400">{project.description}</p>
                    </div>
                    <button 
                        onClick={handleAddMember}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
                    >
                        <UserPlus size={18} /> Add Member
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-8 border-b border-gray-800 mb-8">
                    {[
                        { id: 'tasks', label: 'Tasks', icon: <ClipboardList size={20}/> },
                        { id: 'vault', label: 'Vault', icon: <ShieldCheck size={20}/> },
                        { id: 'snippets', label: 'Snippets', icon: <Code2 size={20}/> },
                        { id: 'live', label: 'Live Code', icon: <Terminal size={20}/> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 pb-4 font-medium transition-colors ${
                                activeTab === tab.id ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-white'
                            }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content Rendering */}
                <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-800">
                    {activeTab === 'tasks' && <Tasks projectId={id} members={project.members || []} />}
                    {activeTab === 'vault' && <Vault projectId={id} />}
                    {activeTab === 'snippets' && <Snippets projectId={id} />}
                    {activeTab === 'live' && <LiveWorkspace projectId={id} />}
                </div>
            </div>
        </div>
    );
};

export default ProjectDetails;