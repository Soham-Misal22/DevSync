import React, { useEffect, useState, useContext, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getProjectTasks, createTask, updateTaskStatus, deleteTask, generateTasksWithAI, editTask, reorderTasks, verifyTask } from '../services/taskService';
import { CheckCircle2, Circle, Clock, Plus, Trash2, Edit2, Sparkles, Loader2, GripVertical, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Skeleton from './Skeleton';
import { AuthContext } from '../context/authContext';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_BASE.replace('/api', '');

const COLUMNS = ['To-Do', 'In Progress', 'Review', 'Done'];

const Tasks = ({ projectId, members = [] }) => {
    const { user } = useContext(AuthContext);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', assignedTo: '' });
    
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);
    const [autoGoal, setAutoGoal] = useState('');
    const [isAIThinking, setIsAIThinking] = useState(false);

    const [editingTask, setEditingTask] = useState(null);
    const [editFormData, setEditFormData] = useState({ title: '', description: '', priority: '', assignedTo: '' });

    const [verifyingTask, setVerifyingTask] = useState(null);
    const [verifyFormData, setVerifyFormData] = useState({ status: 'Approved', prLink: '', comments: '' });

    const fetchTasks = useCallback(async () => {
        try {
            const data = await getProjectTasks(projectId);
            setTasks(data.sort((a, b) => (a.order || 0) - (b.order || 0)));
        } catch (error) {
            toast.error("Failed to load tasks");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => { 
        fetchTasks(); 
        
        const socket = io(SOCKET_URL);
        socket.emit('joinProject', projectId);

        socket.on('tasksUpdated', () => {
            fetchTasks(); 
        });

        return () => {
            socket.emit('leaveProject', projectId);
            socket.disconnect();
        };
    }, [projectId, fetchTasks]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createTask(projectId, { ...newTask, project: projectId, order: tasks.length });
            setIsAdding(false);
            setNewTask({ title: '', description: '', priority: 'Medium', assignedTo: '' });
            fetchTasks();
            toast.success("Task added");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create task");
        }
    };

    const handleAutoGenerate = async (e) => {
        e.preventDefault();
        setIsAIThinking(true);
        try {
            const aiTasks = await generateTasksWithAI(autoGoal);
            for (let i = 0; i < aiTasks.length; i++) {
                await createTask(projectId, {
                    title: aiTasks[i].title,
                    description: aiTasks[i].description,
                    priority: aiTasks[i].priority || 'Medium',
                    assignedTo: user._id,
                    project: projectId,
                    order: tasks.length + i
                });
            }
            setIsAutoGenerating(false);
            setAutoGoal('');
            fetchTasks();
            toast.success(`Generated ${aiTasks.length} tasks!`, { icon: '🤖' });
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to generate tasks using AI");
        } finally {
            setIsAIThinking(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await editTask(editingTask, editFormData);
            setEditingTask(null);
            fetchTasks();
            toast.success("Task updated");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update task");
        }
    };

    const handleDelete = async (taskId) => {
        if (!window.confirm("Delete this task?")) return;
        setTasks(prev => prev.filter(t => t._id !== taskId));
        try {
            await deleteTask(taskId);
            toast.success("Task deleted");
        } catch (err) {
            toast.error("Failed to delete task");
            fetchTasks();
        }
    };

    const handleVerifySubmit = async () => {
        try {
            await verifyTask(verifyingTask._id, verifyFormData);
            toast.success("Verification submitted");
            setVerifyingTask(null);
            fetchTasks();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to verify task");
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const draggedTask = tasks.find(t => t._id === draggableId);
        const sourceStatus = source.droppableId;
        const destStatus = destination.droppableId;

        if (destStatus === 'Done') {
            if (!draggedTask.verification || draggedTask.verification.status !== 'Approved') {
                toast.error("This task must be Verified and Approved before moving to Done!");
                return;
            }
        }

        const newTasks = Array.from(tasks);
        
        const sourceList = newTasks.filter(t => t.status === sourceStatus);
        sourceList.splice(source.index, 1);
        
        const destList = sourceStatus === destStatus ? sourceList : newTasks.filter(t => t.status === destStatus);
        destList.splice(destination.index, 0, { ...draggedTask, status: destStatus });

        const updatedTasksMap = new Map();
        
        const updateOrder = (list, status) => {
            list.forEach((t, index) => {
                updatedTasksMap.set(t._id, { ...t, status, order: index });
            });
        }
        
        if(sourceStatus === destStatus) {
            updateOrder(destList, destStatus);
        } else {
            updateOrder(sourceList, sourceStatus);
            updateOrder(destList, destStatus);
        }

        const finalTasks = newTasks.map(t => updatedTasksMap.get(t._id) || t);
        setTasks(finalTasks.sort((a,b) => (a.order || 0) - (b.order || 0)));

        try {
            const bulkUpdatePayload = Array.from(updatedTasksMap.values()).map(t => ({
                _id: t._id,
                status: t.status,
                order: t.order
            }));
            
            await reorderTasks(bulkUpdatePayload);
        } catch (error) {
            toast.error("Failed to sync board state");
            fetchTasks(); 
        }
    };

    const getPriorityColor = (p) => {
        if (p === 'High') return 'text-red-400 bg-red-400/10 border border-red-400/20';
        if (p === 'Medium') return 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20';
        return 'text-green-400 bg-green-400/10 border border-green-400/20';
    };

    if (isLoading) return <Skeleton lines={5} />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Agile Board</h3>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => { setIsAutoGenerating(!isAutoGenerating); setIsAdding(false); }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-purple-900/50"
                    >
                        <Sparkles size={16} className="text-yellow-300" /> AI Sprint Planner
                    </button>
                    <button
                        onClick={() => { setIsAdding(!isAdding); setIsAutoGenerating(false); }}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-brand-900/50"
                    >
                        <Plus size={20} /> Create Task
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isAutoGenerating && (
                    <motion.form 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleAutoGenerate} 
                        className="glass p-5 rounded-xl border border-purple-500/40 flex flex-col sm:flex-row gap-4 items-end shadow-lg"
                    >
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-purple-300 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                                <Sparkles size={14} className="text-yellow-400" /> What's the goal for this Sprint?
                            </label>
                            <input
                                className="w-full bg-dark-800 border border-purple-500/50 rounded-lg px-4 py-3 text-sm outline-none focus:border-purple-400 text-white transition-all"
                                placeholder="e.g. Build the Kanban Drag and Drop interface"
                                value={autoGoal} onChange={(e) => setAutoGoal(e.target.value)} required
                            />
                        </div>
                        <button type="submit" disabled={isAIThinking} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-lg font-bold text-sm transition-all disabled:opacity-50">
                            {isAIThinking ? <Loader2 size={18} className="animate-spin text-white inline mr-2" /> : null}
                            {isAIThinking ? 'Planning...' : 'Generate Tasks'}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isAdding && (
                    <motion.form 
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        onSubmit={handleCreate} 
                        className="glass p-4 rounded-xl border border-dark-700 flex flex-wrap gap-4 items-end"
                    >
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-gray-400 mb-1">Title</label>
                            <input className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 outline-none focus:border-brand-500 text-white" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required/>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs text-gray-400 mb-1">Description</label>
                            <input className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 outline-none focus:border-brand-500 text-white" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required/>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Priority</label>
                            <select className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 outline-none text-white" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                                <option>Low</option><option>Medium</option><option>High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Assignee</label>
                            <select className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 outline-none text-white" value={newTask.assignedTo} onChange={e => setNewTask({...newTask, assignedTo: e.target.value})} required>
                                <option value="">Select...</option>
                                {members.map(m => <option key={m._id} value={m._id}>{m.name || m.email}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="bg-brand-600 hover:bg-brand-500 px-6 py-2 rounded-lg font-bold text-sm transition-colors text-white">Save Task</button>
                    </motion.form>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {verifyingTask && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.95}} animate={{scale:1}} exit={{scale:0.95}} className="bg-dark-800 border border-dark-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
                            <h3 className="text-xl font-bold mb-4 text-white">Verify Task</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Status</label>
                                    <select className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-white outline-none" value={verifyFormData.status} onChange={e => setVerifyFormData({...verifyFormData, status: e.target.value})}>
                                        <option value="Approved">Approve ✅</option>
                                        <option value="Rejected">Reject ❌</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">PR Link (optional)</label>
                                    <input className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-white outline-none" placeholder="https://github.com/..." value={verifyFormData.prLink} onChange={e => setVerifyFormData({...verifyFormData, prLink: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Comments</label>
                                    <textarea className="w-full bg-dark-900 border border-dark-700 rounded-lg p-2 text-white h-24 outline-none" placeholder="Looks good!" value={verifyFormData.comments} onChange={e => setVerifyFormData({...verifyFormData, comments: e.target.value})} />
                                </div>
                                <div className="flex gap-2 justify-end mt-6">
                                    <button onClick={() => setVerifyingTask(null)} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold text-white transition-colors">Cancel</button>
                                    <button onClick={handleVerifySubmit} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-bold text-white transition-colors">Submit Review</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
                    {COLUMNS.map(column => (
                        <div key={column} className="bg-dark-800/40 rounded-xl p-4 flex flex-col min-h-[500px] border border-dark-700 shadow-inner">
                            <h4 className="font-bold text-gray-300 mb-4 flex items-center justify-between">
                                {column}
                                <span className="bg-dark-700 text-xs px-2 py-1 rounded-full">{tasks.filter(t => t.status === column).length}</span>
                            </h4>
                            
                            <Droppable droppableId={column}>
                                {(provided, snapshot) => (
                                    <div 
                                        ref={provided.innerRef} 
                                        {...provided.droppableProps}
                                        className={`flex-1 transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-dark-700/50' : ''}`}
                                    >
                                        <AnimatePresence>
                                            {tasks.filter(t => t.status === column).map((task, index) => (
                                                <Draggable key={task._id} draggableId={task._id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            style={{...provided.draggableProps.style}}
                                                            className={`mb-3 p-4 rounded-lg border shadow-sm group ${snapshot.isDragging ? 'bg-dark-700 border-brand-500/50 shadow-brand-900/20' : 'bg-dark-800 border-dark-700 hover:border-gray-600'}`}
                                                        >
                                                            {editingTask === task._id ? (
                                                                <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                                                                    <input className="w-full bg-dark-900 border border-dark-700 rounded px-2 py-1 text-sm text-white" value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} />
                                                                    <div className="flex gap-2">
                                                                        <button type="submit" className="text-xs bg-brand-600 px-2 py-1 rounded text-white">Save</button>
                                                                        <button type="button" onClick={() => setEditingTask(null)} className="text-xs bg-gray-600 px-2 py-1 rounded text-white">Cancel</button>
                                                                    </div>
                                                                </form>
                                                            ) : (
                                                                <>
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <div className="flex items-start gap-2">
                                                                            <div {...provided.dragHandleProps} className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing mt-0.5">
                                                                                <GripVertical size={16} />
                                                                            </div>
                                                                            <p className={`font-medium text-sm ${task.status === 'Done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                                                                                {task.title}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <button onClick={() => { setEditingTask(task._id); setEditFormData({ title: task.title, description: task.description, priority: task.priority, assignedTo: task.assignedTo?._id || '' }); }} className="text-gray-400 hover:text-brand-400"><Edit2 size={14}/></button>
                                                                            <button onClick={() => handleDelete(task._id)} className="text-gray-400 hover:text-red-400"><Trash2 size={14}/></button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2 mt-3 items-center">
                                                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                                                                            {task.priority}
                                                                        </span>
                                                                        {task.assignedTo && (
                                                                            <span className="text-[10px] text-gray-400 bg-dark-900 px-2 py-0.5 rounded border border-dark-700 truncate max-w-[120px]">
                                                                                {task.assignedTo.name || task.assignedTo.email}
                                                                            </span>
                                                                        )}
                                                                        {task.verification?.status === 'Approved' && (
                                                                            <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded flex items-center gap-1 border border-green-400/20">
                                                                                <ShieldCheck size={12}/> Verified
                                                                            </span>
                                                                        )}
                                                                        {task.verification?.status === 'Rejected' && (
                                                                            <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded flex items-center gap-1 border border-red-400/20">
                                                                                <ShieldCheck size={12}/> Rejected
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {task.status !== 'Done' && (
                                                                        <button 
                                                                            onClick={() => {
                                                                                setVerifyingTask(task);
                                                                                setVerifyFormData({ status: 'Approved', prLink: task.verification?.prLink || '', comments: task.verification?.comments || '' });
                                                                            }}
                                                                            className="mt-3 w-full text-[11px] font-bold bg-dark-700 hover:bg-dark-600 text-gray-300 py-1.5 rounded transition-colors flex justify-center items-center gap-1"
                                                                        >
                                                                            <ShieldCheck size={14} /> Review & Verify
                                                                        </button>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        </AnimatePresence>
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default Tasks;