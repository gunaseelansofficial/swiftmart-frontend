import AdminLayout from '../../components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, X, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/imageHelper';

const AdminBanners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        sortOrder: 0,
        isActive: true
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const { data } = await api.get('/banners/admin');
            setBanners(data.banners);
        } catch (error) {
            toast.error('Failed to fetch banners');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (banner) => {
        setIsEditing(true);
        setSelectedBanner(banner);
        setFormData({
            title: banner.title,
            link: banner.link || '',
            sortOrder: banner.sortOrder || 0,
            isActive: banner.isActive
        });
        setImagePreview(getImageUrl(banner.image));
        setShowModal(true);
    };

    const handleAddNew = () => {
        setIsEditing(false);
        setSelectedBanner(null);
        setFormData({ title: '', link: '', sortOrder: 0, isActive: true });
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
        data.append('title', formData.title);
        data.append('link', formData.link);
        data.append('sortOrder', formData.sortOrder);
        data.append('isActive', formData.isActive);
        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            if (isEditing) {
                await api.patch(`/banners/${selectedBanner._id}`, data);
                toast.success('Banner updated successfully');
            } else {
                await api.post('/banners', data);
                toast.success('Banner created successfully');
            }
            setShowModal(false);
            fetchBanners();
        } catch (error) {
            toast.error(isEditing ? 'Failed to update banner' : 'Failed to create banner');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;
        try {
            await api.delete(`/banners/${id}`);
            toast.success('Banner deleted successfully');
            fetchBanners();
        } catch (error) {
            toast.error('Failed to delete banner');
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-lg font-heading font-extrabold text-gray-800">Banner Management</h3>
                    <p className="text-sm text-text-muted">Manage homepage hero offers and promotional sliders</p>
                </div>
                <button
                    onClick={handleAddNew}
                    className="btn-primary flex items-center space-x-2 !py-2.5"
                >
                    <Plus size={20} />
                    <span>Add New Banner</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {loading ? (
                    Array(2).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
                    ))
                ) : banners.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <ImageIcon size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-bold">No banners yet.</p>
                    </div>
                ) : (
                    banners.map((banner) => (
                        <motion.div
                            key={banner._id}
                            className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden group"
                        >
                            <div className="relative aspect-[21/9] bg-gray-50 border-b border-gray-100 overflow-hidden">
                                <img 
                                    src={getImageUrl(banner.image)} 
                                    className="w-full h-full object-cover" 
                                    alt={banner.title} 
                                    onError={(e) => e.target.src = '/placeholder-banner.png'}
                                />
                                <div className="absolute top-4 right-4 flex space-x-2">
                                    <button onClick={() => handleEdit(banner)} className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-brand-primary shadow-lg transition-all"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(banner._id)} className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-600 hover:text-red-500 shadow-lg transition-all"><Trash2 size={18} /></button>
                                </div>
                                {!banner.isActive && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">Inactive</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-heading font-extrabold text-gray-800">{banner.title}</h4>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded">Order: {banner.sortOrder}</span>
                                </div>
                                {banner.link && (
                                    <div className="flex items-center space-x-2 text-xs text-brand-primary font-bold">
                                        <LinkIcon size={14} />
                                        <span className="truncate">{banner.link}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
                            <div className="p-6 bg-brand-primary text-white flex justify-between items-center">
                                <h2 className="text-xl font-heading font-extrabold">{isEditing ? 'Edit Banner' : 'Create Banner'}</h2>
                                <button onClick={() => setShowModal(false)}><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Banner Title</label>
                                        <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="input-field" placeholder="e.g. 50% Off on Fresh Fruits" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Target Link</label>
                                        <input type="text" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="input-field" placeholder="e.g. /category/fruits" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Sort Order</label>
                                            <input type="number" value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} className="input-field" />
                                        </div>
                                        <div className="flex flex-col justify-end">
                                            <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="w-5 h-5 rounded text-brand-primary focus:ring-brand-primary" />
                                                <span className="text-sm font-bold text-gray-700">Active</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-3">Banner Image</label>
                                    <div className="flex flex-col space-y-4">
                                        <div className="w-full aspect-[21/9] rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                                            {imagePreview ? (
                                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                            ) : (
                                                <ImageIcon size={48} className="text-gray-200" />
                                            )}
                                        </div>
                                        <div>
                                            <label className="flex items-center justify-center space-x-2 w-full py-4 bg-gray-50 text-gray-600 rounded-xl border border-gray-200 font-bold text-xs uppercase cursor-pointer hover:bg-gray-100 transition-all">
                                                <Upload size={18} />
                                                <span>{imagePreview ? 'Change Banner Image' : 'Upload Banner Image'}</span>
                                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                            </label>
                                            <p className="text-[10px] text-gray-400 mt-2 font-black uppercase tracking-widest text-center">Recommended: 1260x540px (21:9 ratio) • JPG/PNG</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3 font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase text-xs tracking-widest">Cancel</button>
                                    <button type="submit" className="btn-primary min-w-[160px] uppercase text-xs tracking-widest">{isEditing ? 'Save Changes' : 'Create Banner'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminBanners;
