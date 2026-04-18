import { useEffect, useState } from 'react';
import { getVaultItems, addVaultItem } from '../services/vaultService';
import { Eye, EyeOff, Lock, Plus, Copy, Check } from 'lucide-react';

const Vault = ({ projectId }) => {
    const [items, setItems] = useState([]);
    const [showValues, setShowValues] = useState({}); // To toggle visibility for each key
    const [copiedId, setCopiedId] = useState(null);
    const [newItem, setNewItem] = useState({ keyName: '', secretValue: '' });

    useEffect(() => {
        const fetchVault = async () => {
            const data = await getVaultItems(projectId);
            setItems(data);
        };
        fetchVault();
    }, [projectId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        await addVaultItem(projectId, newItem);
        setNewItem({ keyName: '', secretValue: '' });
        // Refresh list
        const data = await getVaultItems(projectId);
        setItems(data);
    };

    const toggleVisibility = (id) => {
        setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Add Secret Form */}
            <form onSubmit={handleAdd} className="flex gap-4 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <input 
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Key Name (e.g. STRIPE_KEY)"
                    value={newItem.keyName}
                    onChange={(e) => setNewItem({...newItem, keyName: e.target.value})}
                />
                <input 
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="Secret Value"
                    value={newItem.secretValue}
                    onChange={(e) => setNewItem({...newItem, secretValue: e.target.value})}
                />
                <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                    <Plus size={16}/> Add
                </button>
            </form>

            {/* Secrets List */}
            <div className="grid gap-3">
                {items.map(item => (
                    <div key={item._id} className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-gray-700 p-2 rounded-lg text-gray-400">
                                <Lock size={18}/>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">{item.keyName}</p>
                                <p className="font-mono text-sm">
                                    {showValues[item._id] ? item.secretValue : '••••••••••••••••'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => toggleVisibility(item._id)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                                {showValues[item._id] ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                            <button onClick={() => copyToClipboard(item.secretValue, item._id)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                                {copiedId === item._id ? <Check size={18} className="text-green-500"/> : <Copy size={18}/>}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Vault;