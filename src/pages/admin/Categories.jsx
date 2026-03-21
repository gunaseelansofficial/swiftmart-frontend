import AdminLayout from '../../components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Edit, Trash2, Layers, Upload, X, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/imageHelper';

const AdminCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        sortOrder: 0
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data.categories);
        } catch (error) {
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (cat) => {
        setIsEditing(true);
        setSelectedCategory(cat);
        setFormData({
            name: cat.name,
            sortOrder: cat.sortOrder || 0
        });
        setImagePreview(getImageUrl(cat.image));
        setShowModal(true);
    };

    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedCategory(null);
        setFormData({ name: '', sortOrder: 0 });
        setImagePreview(null);
        setImageFile(null);
        setShowModal(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', formData.name);
        data.append('sortOrder', formData.sortOrder);
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            if (isEditing) {
                await api.patch(`/categories/${selectedCategory._id}`, data);
                toast.success('Category updated successfully');
            } else {
                await api.post('/categories', data);
                toast.success('Category created successfully');
            }
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            toast.error(isEditing ? 'Failed to update category' : 'Failed to create category');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Category deleted successfully');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-lg font-heading font-extrabold text-gray-800">Category Management</h3>
                    <p className="text-sm text-text-muted">Organize your products with categories</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="btn-primary flex items-center space-x-2 !py-2.5"
                >
                    <Plus size={20} />
                    <span>Add New Category</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-md" />
                    ))
                ) : categories.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-md border border-dashed border-gray-200">
                        <Layers size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold">No categories yet.</p>
                    </div>
                ) : (
                    categories.map((cat) => (
                        <motion.div
                            key={cat._id}
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-md shadow-card border border-gray-100 flex flex-col items-center text-center relative"
                        >
                            <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 bg-gray-50 border border-gray-100 flex items-center justify-center relative">
                                <img 
                                    src={getImageUrl(cat.image)} 
                                    className="w-full h-full object-cover" 
                                    alt={cat.name} 
                                    onError={(e) => e.target.src = '/placeholder-product.png'}
                                />
                            </div>
                            <h4 className="font-heading font-extrabold text-gray-800 mb-1">{cat.name}</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order: {cat.sortOrder}</p>
                            <div className="absolute top-4 right-4 flex space-x-1">
                                <button onClick={() => handleEdit(cat)} className="p-1.5 text-gray-400 hover:text-brand-primary transition-colors"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(cat._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
                            <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
                                <h2 className="text-xl font-heading font-extrabold">{isEditing ? 'Edit Category' : 'Create Category'}</h2>
                                <button onClick={() => setShowModal(false)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category Name</label>
                                    <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="e.g. Fruits & Vegetables" />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Sort Order</label>
                                        <input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} className="input-field" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Category Image</label>
                                    <div className="flex items-center space-x-6">
                                        <div className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {imagePreview ? (
                                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <ImageIcon size={32} className="text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <label className="flex items-center justify-center space-x-2 w-full py-3 bg-gray-50 text-gray-600 rounded-xl border border-gray-200 font-bold text-xs uppercase cursor-pointer hover:bg-gray-100 transition-all">
                                                <Upload size={16} />
                                                <span>{imagePreview ? 'Change Image' : 'Upload Image'}</span>
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                            </label>
                                            <p className="text-[10px] text-gray-400 mt-2 font-medium uppercase tracking-wider">Recommended: 600x600px PNG/JPG</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase text-xs tracking-widest">Cancel</button>
                                    <button type="submit" className="btn-primary min-w-[120px] uppercase text-xs tracking-widest">{isEditing ? 'Save Changes' : 'Create Category'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminCategories;
