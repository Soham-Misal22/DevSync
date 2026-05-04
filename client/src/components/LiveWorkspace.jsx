import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { getProjectSnapshots, createSnapshot } from '../services/snapshotService';
import { Save, History, Code2, Users, Loader2, GitCommit } from 'lucide-react';
import toast from 'react-hot-toast';
import moment from 'moment';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_BASE.replace('/api', '');

const LiveWorkspace = ({ projectId }) => {
    const [code, setCode] = useState('// Welcome to the Live Workspace\n// Type here to collaborate in real-time...\n');
    const [snapshots, setSnapshots] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    const socketRef = useRef(null);
    const editorRef = useRef(null);
    // Use a ref to prevent echoing back our own changes
    const isReceivingCode = useRef(false);

    useEffect(() => {
        // Fetch Snapshots
        loadSnapshots();

        // Socket Connection
        socketRef.current = io(SOCKET_URL);
        socketRef.current.emit('joinLiveCode', projectId);

        socketRef.current.on('receiveCodeChange', (newCode) => {
            isReceivingCode.current = true;
            setCode(newCode);
            // Allow the next local change to be sent
            setTimeout(() => { isReceivingCode.current = false; }, 50);
        });

        return () => {
            socketRef.current.emit('leaveLiveCode', projectId);
            socketRef.current.disconnect();
        };
    }, [projectId]);

    const loadSnapshots = async () => {
        try {
            const data = await getProjectSnapshots(projectId);
            setSnapshots(data);
            if(data.length > 0 && code.startsWith('// Welcome')) {
                setCode(data[0].code); // Load latest snapshot
            }
        } catch (error) {
            toast.error("Failed to load snapshots");
        }
    };

    const handleEditorChange = (value) => {
        setCode(value);
        if (!isReceivingCode.current) {
            socketRef.current.emit('codeChange', { projectId, code: value });
        }
    };

    const handleSaveSnapshot = async (e) => {
        e.preventDefault();
        if(!commitMessage.trim()) return toast.error("Commit message required");
        setIsSaving(true);
        try {
            await createSnapshot(projectId, { code, message: commitMessage, fileName: 'index.js' });
            setCommitMessage('');
            toast.success("Snapshot saved!");
            loadSnapshots();
        } catch (error) {
            toast.error("Failed to save snapshot");
        } finally {
            setIsSaving(false);
        }
    };

    const restoreSnapshot = (snap) => {
        if(window.confirm("Are you sure you want to restore this snapshot? This will overwrite the current live code for everyone.")) {
            setCode(snap.code);
            socketRef.current.emit('codeChange', { projectId, code: snap.code });
            toast.success("Snapshot restored!");
            setShowHistory(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-160px)] -mt-2">
            {/* Toolbar */}
            <div className="flex justify-between items-center bg-dark-800 p-3 rounded-t-xl border border-dark-700 border-b-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-brand-400 font-bold">
                        <Code2 size={20} />
                        <span>LiveEditor.js</span>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded flex items-center gap-1">
                        <Users size={12} /> Sync Active
                    </span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowHistory(!showHistory)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${showHistory ? 'bg-brand-600 text-white' : 'bg-dark-700 hover:bg-dark-600 text-gray-300'}`}
                    >
                        <History size={16} /> History ({snapshots.length})
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden border border-dark-700 rounded-b-xl relative">
                {/* Editor Area */}
                <div className={`flex-1 transition-all ${showHistory ? 'w-2/3 border-r border-dark-700' : 'w-full'}`}>
                    <Editor
                        height="100%"
                        defaultLanguage="javascript"
                        theme="vs-dark"
                        value={code}
                        onChange={handleEditorChange}
                        onMount={(editor) => editorRef.current = editor}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            padding: { top: 16 }
                        }}
                    />
                </div>

                {/* History Sidebar */}
                {showHistory && (
                    <div className="w-1/3 bg-dark-800 flex flex-col">
                        <div className="p-4 border-b border-dark-700 bg-dark-900/50">
                            <h4 className="font-bold text-gray-200 mb-3 flex items-center gap-2"><Save size={16}/> Create Snapshot</h4>
                            <form onSubmit={handleSaveSnapshot} className="flex gap-2">
                                <input 
                                    className="flex-1 bg-dark-900 border border-dark-700 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-brand-500"
                                    placeholder="Commit message..."
                                    value={commitMessage}
                                    onChange={e => setCommitMessage(e.target.value)}
                                    maxLength={50}
                                />
                                <button disabled={isSaving} className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center">
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                                </button>
                            </form>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {snapshots.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center mt-4">No snapshots saved yet.</p>
                            ) : (
                                snapshots.map(snap => (
                                    <div key={snap._id} className="bg-dark-900/50 border border-dark-700 p-3 rounded-lg hover:border-gray-600 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="font-bold text-sm text-gray-200 flex items-center gap-1.5">
                                                <GitCommit size={14} className="text-brand-400" />
                                                {snap.message}
                                            </p>
                                            <span className="text-[10px] text-gray-500">{moment(snap.createdAt).fromNow()}</span>
                                        </div>
                                        <div className="flex justify-between items-end mt-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white">
                                                    {snap.createdBy?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="text-[10px] text-gray-400">{snap.createdBy?.name}</span>
                                            </div>
                                            <button 
                                                onClick={() => restoreSnapshot(snap)}
                                                className="text-[10px] font-bold bg-dark-700 hover:bg-brand-600 hover:text-white text-gray-400 px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                Restore
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveWorkspace;
