import { useEffect, useState } from 'react';
import { getProjectSnippets, createSnippet, deleteSnippet, explainSnippet } from '../services/snippetService';
import { Code2, Terminal, Copy, Plus, Trash2, CheckCircle2, Sparkles, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from './Skeleton';

const Snippets = ({ projectId }) => {
    const [snippets, setSnippets] = useState([]);
    const [activeTab, setActiveTab] = useState('api_doc'); // 'api_doc' or 'code'
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedId, setCopiedId] = useState(null);

    // AI States
    const [isExplaining, setIsExplaining] = useState(null);
    const [explanations, setExplanations] = useState({});

    const [newSnippet, setNewSnippet] = useState({
        title: '', method: 'GET', url: '', language: 'javascript', description: '', body: '', project: projectId
    });

    const fetchSnippets = async () => {
        try {
            const data = await getProjectSnippets(projectId);
            setSnippets(data);
        } catch (error) {
            toast.error("Failed to load snippets");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchSnippets(); }, [projectId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createSnippet({ ...newSnippet, type: activeTab });
            setIsAdding(false);
            setNewSnippet({ title: '', method: 'GET', url: '', language: 'javascript', description: '', body: '', project: projectId });
            fetchSnippets();
            toast.success("Snippet created!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create snippet");
        }
    };

    const handleDelete = async (snippetId) => {
        const confirm = window.confirm("Are you sure you want to delete this snippet?");
        if (!confirm) return;

        setSnippets(prev => prev.filter(s => s._id !== snippetId));

        try {
            await deleteSnippet(snippetId);
            toast.success("Snippet deleted");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete snippet");
            fetchSnippets();
        }
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleExplain = async (snippet) => {
        setIsExplaining(snippet._id);
        try {
            const data = await explainSnippet(snippet);
            setExplanations(prev => ({ ...prev, [snippet._id]: data.explanation }));
            toast.success("AI Explanation generated!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to generate explanation");
        } finally {
            setIsExplaining(null);
        }
    };

    const getMethodColor = (m) => {
        if (m === 'POST') return 'text-green-400 bg-green-400/10 border-green-400/20';
        if (m === 'GET') return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
        if (m === 'DELETE') return 'text-red-400 bg-red-400/10 border-red-400/20';
        if (m === 'PUT' || m === 'PATCH') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    };

    const displaySnippets = snippets.filter(s => activeTab === 'api_doc' ? (!s.type || s.type === 'api_doc') : s.type === 'code');

    if (isLoading) return <Skeleton lines={4} />;

    return (
        <div className="space-y-6">
            {/* Header and Tabs */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-gray-800 pb-4">
                <div className="flex gap-4">
                    <button
                        onClick={() => { setActiveTab('api_doc'); setIsAdding(false); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'api_doc' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Terminal size={18} /> API Docs
                    </button>
                    <button
                        onClick={() => { setActiveTab('code'); setIsAdding(false); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'code' ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Code2 size={18} /> Code Snippets
                    </button>
                </div>
                <button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors cursor-pointer self-start sm:self-auto">
                    <Plus size={20} />
                </button>
            </div>

            {/* Create Form */}
            {isAdding && (
                <form onSubmit={handleCreate} className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
                    <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Title</label>
                        <input placeholder={activeTab === 'api_doc' ? "e.g. Get User Profile" : "e.g. Utility Format Date"} className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700 outline-none focus:border-blue-500" value={newSnippet.title} onChange={e => setNewSnippet({ ...newSnippet, title: e.target.value })} required />
                    </div>

                    {activeTab === 'api_doc' ? (
                        <>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Method</label>
                                <select className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700 outline-none focus:border-blue-500 text-white" value={newSnippet.method} onChange={e => setNewSnippet({ ...newSnippet, method: e.target.value })}>
                                    <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option><option>PATCH</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Endpoint URL</label>
                                <input placeholder="/api/users/profile" className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700 outline-none focus:border-blue-500" value={newSnippet.url} onChange={e => setNewSnippet({ ...newSnippet, url: e.target.value })} required />
                            </div>
                        </>
                    ) : (
                        <div className="col-span-2">
                            <label className="block text-xs text-gray-400 mb-1">Language</label>
                            <input placeholder="e.g. JavaScript, Python, React" className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700 outline-none focus:border-blue-500" value={newSnippet.language} onChange={e => setNewSnippet({ ...newSnippet, language: e.target.value })} />
                        </div>
                    )}

                    <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">Description</label>
                        <input placeholder={activeTab === 'api_doc' ? "Brief explanation of what this endpoint does" : "What does this code do?"} className="w-full bg-gray-800 p-2 rounded-lg border border-gray-700 outline-none focus:border-blue-500" value={newSnippet.description} onChange={e => setNewSnippet({ ...newSnippet, description: e.target.value })} required />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-1">{activeTab === 'api_doc' ? "JSON Body (Optional)" : "Code"}</label>
                        <textarea placeholder={activeTab === 'api_doc' ? "{\n  &quot;key&quot;: &quot;value&quot;\n}" : "const foo = 'bar';"} className="w-full bg-gray-800 p-3 rounded-lg border border-gray-700 h-32 font-mono text-sm outline-none focus:border-blue-500" value={newSnippet.body} onChange={e => setNewSnippet({ ...newSnippet, body: e.target.value })} required={activeTab === 'code'} />
                    </div>

                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 py-2.5 rounded-lg font-bold col-span-2 transition-colors cursor-pointer mt-2 text-sm">
                        Save {activeTab === 'api_doc' ? 'API Doc' : 'Code Snippet'}
                    </button>
                </form>
            )}

            <div className="space-y-4">
                {displaySnippets.map(s => (
                    <div key={s._id} className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden group flex flex-col">

                        {/* Card Header */}
                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 gap-4">
                            <div className="flex items-start sm:items-center gap-3">
                                {activeTab === 'api_doc' ? (
                                    <span className={`font-bold text-[10px] tracking-wider uppercase px-2 py-1 rounded border ${getMethodColor(s.method)}`}>
                                        {s.method}
                                    </span>
                                ) : (
                                    <span className="font-bold text-[10px] tracking-wider uppercase px-2 py-1 rounded border text-purple-400 bg-purple-400/10 border-purple-400/20">
                                        {s.language || 'Code'}
                                    </span>
                                )}
                                <div>
                                    <span className="text-white font-medium block">{s.title}</span>
                                    {s.description && <span className="text-gray-500 text-xs block mt-0.5">{s.description}</span>}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {activeTab === 'api_doc' && s.url && (
                                    <span className="text-blue-300 text-xs font-mono bg-blue-900/20 px-2 py-1 rounded border border-blue-900/50">
                                        {s.url}
                                    </span>
                                )}
                                <button
                                    onClick={() => handleDelete(s._id)}
                                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                    title="Delete Snippet"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Explain Button Row */}
                        {!explanations[s._id] && (
                            <div className="bg-gray-800/20 px-4 py-2 flex justify-end border-b border-gray-800">
                                <button
                                    onClick={() => handleExplain(s)}
                                    disabled={isExplaining === s._id}
                                    className="text-xs font-semibold flex items-center gap-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/40 hover:to-purple-600/40 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-md transition-all disabled:opacity-50"
                                >
                                    {isExplaining === s._id ? (
                                        <><Loader2 size={14} className="animate-spin" /> Gemini is thinking...</>
                                    ) : (
                                        <><Sparkles size={14} className="text-yellow-400" /> Explain with AI</>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* AI Explanation Box */}
                        {explanations[s._id] && (
                            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-4 border-b border-blue-500/20 relative">
                                <button
                                    onClick={() => setExplanations(prev => { const n = { ...prev }; delete n[s._id]; return n; })}
                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-300"
                                >
                                    <X size={16} />
                                </button>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-blue-300 mb-2">
                                    <Sparkles size={16} className="text-yellow-400" /> AI Explanation
                                </h4>
                                <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {explanations[s._id].replace(/^\*\s/gm, '• ')}
                                </div>
                            </div>
                        )}

                        {/* Code Body */}
                        {s.body && (
                            <div className="bg-black/40 p-4 relative group/code">
                                <pre className={`text-gray-400 text-xs overflow-x-auto ${activeTab === 'code' ? 'font-mono text-green-300/80' : 'font-mono'}`}>
                                    {s.body}
                                </pre>
                                <button
                                    onClick={() => handleCopy(s.body, s._id)}
                                    className="absolute top-3 right-3 p-1.5 opacity-0 group-hover/code:opacity-100 transition-opacity bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 hover:text-white text-gray-300 cursor-pointer"
                                    title="Copy to clipboard"
                                >
                                    {copiedId === s._id ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {displaySnippets.length === 0 && !isLoading && (
                    <div className="text-center py-10 text-gray-500 border border-dashed border-gray-700 rounded-xl">
                        No {activeTab === 'api_doc' ? 'API snippets' : 'code snippets'} added to this project yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Snippets;
