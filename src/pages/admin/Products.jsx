import AdminLayout from '../../components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Search, Filter, Edit, Trash2, MoreVertical, Package, AlertCircle, X, Zap, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getImageUrl } from '../../utils/imageHelper';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        price: '',
        mrp: '',
        stock: '',
        weight: '',
        unit: 'kg',
        highlights: [],
        information: [],
        offers: [],
        easyRefunds: false,
        fastDelivery: true,
        netQuantity: '',
        countryOfOrigin: '',
        shelfLife: '',
        sellerName: '',
        sellerAddress: '',
        isHomePage: false
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            setProducts(data.products);
        } catch (error) {
            toast.error('Failed to fetch products');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories');
            setCategories(data.categories);
        } catch (error) {
            toast.error('Failed to fetch categories');
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const totalFiles = imageFiles.length + selectedFiles.length;

        if (totalFiles > 4) {
            toast.error('You can upload a maximum of 4 images per product');
            return;
        }

        const validFiles = [];
        const validPreviews = [];

        selectedFiles.forEach(file => {
            if (file.size > 100 * 1024) {
                toast.error(`File "${file.name}" exceeds 100kb limit.`);
            } else {
                validFiles.push(file);
                validPreviews.push(URL.createObjectURL(file));
            }
        });

        setImageFiles([...imageFiles, ...validFiles]);
        setPreviews([...previews, ...validPreviews]);
        
        // Clear input to allow re-selecting same files
        e.target.value = null;
    };

    const removePreview = (index) => {
        const newFiles = imageFiles.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        setImageFiles(newFiles);
        setPreviews(newPreviews);
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            category: product.category?._id || product.category,
            price: product.price,
            mrp: product.mrp,
            stock: product.stock,
            weight: product.weight,
            unit: product.unit,
            highlights: product.highlights || [],
            information: product.information || [],
            offers: product.offers || [],
            easyRefunds: product.easyRefunds || false,
            fastDelivery: product.fastDelivery !== undefined ? product.fastDelivery : true,
            netQuantity: product.netQuantity || '',
            countryOfOrigin: product.countryOfOrigin || '',
            shelfLife: product.shelfLife || '',
            sellerName: product.sellerName || '',
            sellerAddress: product.sellerAddress || '',
            isHomePage: product.isHomePage || false
        });
        
        const existingPreviews = (product.images || []).map(img => getImageUrl(img));
        setPreviews(existingPreviews);
        setImageFiles([]); // Clear new file selections
        setShowAddModal(true);
    };

    const handleDynamicChange = (section, index, field, value) => {
        const updated = [...formData[section]];
        updated[index][field] = value;
        setFormData({ ...formData, [section]: updated });
    };

    const addDynamicRow = (section, initialObj) => {
        setFormData({ ...formData, [section]: [...formData[section], initialObj] });
    };

    const removeDynamicRow = (section, index) => {
        const updated = formData[section].filter((_, i) => i !== index);
        setFormData({ ...formData, [section]: updated });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/products/${id}`);
            toast.success('Product deleted successfully');
            fetchProducts();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        
        // Append all text fields
        Object.keys(formData).forEach(key => {
            if (['highlights', 'information', 'offers'].includes(key)) {
                data.append(key, JSON.stringify(formData[key]));
            } else {
                data.append(key, formData[key]);
            }
        });

        // Append images
        if (imageFiles.length > 0) {
            imageFiles.forEach(file => {
                data.append('images', file);
            });
        } else if (editingProduct && previews.length > 0) {
            // If no NEW files uploaded but we have previews (original images),
            // we should tell the backend to keep them. 
            // In a real app we'd handle individual deletions better.
            const existingImages = previews
                .filter(p => !p.startsWith('blob:'))
                .map(p => p.split('/').slice(-2).join('/')); // Get 'uploads/filename.jpg'
            data.append('images', JSON.stringify(existingImages));
        }

        try {
            if (editingProduct) {
                await api.patch(`/products/${editingProduct._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Product updated successfully');
            } else {
                await api.post('/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('Product created successfully');
            }
            setShowAddModal(false);
            setEditingProduct(null);
            setImageFiles([]);
            setPreviews([]);
            fetchProducts();
            setFormData({
                name: '', description: '', category: '', price: '', mrp: '', stock: '', weight: '', unit: 'kg',
                highlights: [], information: [], offers: [], easyRefunds: false, fastDelivery: true,
                netQuantity: '', countryOfOrigin: '', shelfLife: '', sellerName: '', sellerAddress: '', isHomePage: false
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save product');
        }
    };

    return (
        <AdminLayout>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-lg font-heading font-extrabold text-gray-800">Inventory Management</h3>
                    <p className="text-sm text-text-muted">Managed {products.length} products in your store</p>
                </div>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setFormData({
                            name: '', description: '', category: '', price: '', mrp: '', stock: '', weight: '', unit: 'kg',
                            highlights: [], information: [], offers: [], easyRefunds: false, fastDelivery: true,
                            netQuantity: '', countryOfOrigin: '', shelfLife: '', sellerName: '', sellerAddress: '', isHomePage: false
                        });
                        setShowAddModal(true);
                        setPreviews([]);
                        setImageFiles([]);
                    }}
                    className="btn-primary flex items-center space-x-2 !py-2.5"
                >
                    <Plus size={20} />
                    <span>Add New Product</span>
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between mb-8">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-all text-sm font-bold">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <select className="px-4 py-2 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition-all text-sm font-bold border-none outline-none">
                        <option>All Categories</option>
                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-md shadow-card border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price (₹)</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-8"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center">
                                            <Package size={48} className="text-gray-200 mb-4" />
                                            <p className="text-gray-400 font-bold">No products found. Start by adding one!</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-100">
                                                    {product.images?.[0] ? (
                                                        <img 
                                                            src={getImageUrl(product.images[0])} 
                                                            alt={product.name} 
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => e.target.src = '/placeholder-product.png'}
                                                        />
                                                    ) : (
                                                        <Package className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{product.name}</p>
                                                    <p className="text-xs text-text-muted">{product.weight} {product.unit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                            {product.category?.name || 'Uncategorized'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800">₹{product.price}</span>
                                                <span className="text-[10px] text-gray-400 line-through">₹{product.mrp}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className={`font-bold ${product.stock <= product.lowStockThreshold ? 'text-red-500' : 'text-gray-800'}`}>
                                                    {product.stock}
                                                </span>
                                                {product.stock <= product.lowStockThreshold && (
                                                    <span className="text-[10px] font-bold text-red-400 flex items-center space-x-1">
                                                        <AlertCircle size={10} />
                                                        <span>Low Stock</span>
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {product.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(product._id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Product Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white w-full max-w-2xl rounded-lg shadow-2xl p-8 overflow-y-auto max-h-[90vh]"
                        >
                            <h2 className="text-2xl font-heading font-extrabold text-gray-800 mb-6">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h2>
                            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Product Name</label>
                                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="input-field" placeholder="e.g. Fresh Red Apples" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Product Images ({previews.length}/4)</label>
                                    <div className="grid grid-cols-4 gap-4">
                                        {previews.map((src, index) => (
                                            <div key={index} className="relative group aspect-square rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
                                                <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                                <button 
                                                    type="button"
                                                    onClick={() => removePreview(index)}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        {previews.length < 4 && (
                                            <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-200 rounded-xl hover:border-brand-primary cursor-pointer transition-colors bg-gray-50 group">
                                                <Plus size={24} className="text-gray-300 group-hover:text-brand-primary" />
                                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-brand-primary uppercase mt-1">Add Image</span>
                                                <input 
                                                    type="file" 
                                                    multiple
                                                    accept=".jpg,.jpeg,.png,.webp" 
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                    <p className="mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Max 4 images • 100kb each • JPG/PNG/WEBP</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                                    <textarea name="description" required value={formData.description} onChange={handleInputChange} className="input-field h-32" placeholder="Tell us more about this product..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                                    <select name="category" required value={formData.category} onChange={handleInputChange} className="input-field">
                                        <option value="">Select Category</option>
                                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Stock Quantity</label>
                                    <input type="number" name="stock" required value={formData.stock} onChange={handleInputChange} className="input-field" placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Selling Price (₹)</label>
                                    <input type="number" name="price" required value={formData.price} onChange={handleInputChange} className="input-field" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">MRP (₹)</label>
                                    <input type="number" name="mrp" required value={formData.mrp} onChange={handleInputChange} className="input-field" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Weight / Size</label>
                                    <input type="text" name="weight" required value={formData.weight} onChange={handleInputChange} className="input-field" placeholder="500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Unit</label>
                                    <select name="unit" value={formData.unit} onChange={handleInputChange} className="input-field">
                                        <option value="kg">kg</option>
                                        <option value="gm">gm</option>
                                        <option value="ml">ml</option>
                                        <option value="ltr">ltr</option>
                                        <option value="pc">piece</option>
                                    </select>
                                </div>

                                <div className="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-2">
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                <ShieldCheck size={18} />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">Easy Refunds</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, easyRefunds: !formData.easyRefunds })}
                                            className={`w-12 h-6 rounded-full transition-all relative ${formData.easyRefunds ? 'bg-brand-primary' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.easyRefunds ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                                                <Zap size={18} />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">Fast Delivery</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, fastDelivery: !formData.fastDelivery })}
                                            className={`w-12 h-6 rounded-full transition-all relative ${formData.fastDelivery ? 'bg-brand-primary' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.fastDelivery ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500">
                                                <Star size={18} fill={formData.isHomePage ? 'currentColor' : 'none'} />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">Home Page</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, isHomePage: !formData.isHomePage })}
                                            className={`w-12 h-6 rounded-full transition-all relative ${formData.isHomePage ? 'bg-brand-primary' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isHomePage ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="col-span-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Net Quantity</label>
                                        <input type="text" name="netQuantity" value={formData.netQuantity} onChange={handleInputChange} className="input-field" placeholder="e.g. 500g" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Country of Origin</label>
                                        <input type="text" name="countryOfOrigin" value={formData.countryOfOrigin} onChange={handleInputChange} className="input-field" placeholder="e.g. India" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Shelf Life</label>
                                        <input type="text" name="shelfLife" value={formData.shelfLife} onChange={handleInputChange} className="input-field" placeholder="e.g. 6 Months" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Seller Name</label>
                                        <input type="text" name="sellerName" value={formData.sellerName} onChange={handleInputChange} className="input-field" placeholder="Seller Name" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Seller Address</label>
                                        <input type="text" name="sellerAddress" value={formData.sellerAddress} onChange={handleInputChange} className="input-field" placeholder="Full Seller Address" />
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-6">
                                    {/* Highlights Section */}
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-800">Product Highlights</h4>
                                            <button type="button" onClick={() => addDynamicRow('highlights', { label: '', value: '' })} className="text-xs font-black text-brand-primary uppercase tracking-widest flex items-center space-x-1">
                                                <Plus size={14} />
                                                <span>Add Row</span>
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.highlights.map((row, idx) => (
                                                <div key={idx} className="flex gap-3 items-center">
                                                    <input type="text" value={row.label} onChange={(e) => handleDynamicChange('highlights', idx, 'label', e.target.value)} placeholder="Label (e.g. Type)" className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary" />
                                                    <input type="text" value={row.value} onChange={(e) => handleDynamicChange('highlights', idx, 'value', e.target.value)} placeholder="Value (e.g. Fruit)" className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary" />
                                                    <button type="button" onClick={() => removeDynamicRow('highlights', idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Information Section */}
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-800">Additional Information</h4>
                                            <button type="button" onClick={() => addDynamicRow('information', { label: '', value: '' })} className="text-xs font-black text-brand-primary uppercase tracking-widest flex items-center space-x-1">
                                                <Plus size={14} />
                                                <span>Add Row</span>
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.information.map((row, idx) => (
                                                <div key={idx} className="flex gap-3 items-center">
                                                    <input type="text" value={row.label} onChange={(e) => handleDynamicChange('information', idx, 'label', e.target.value)} placeholder="Label (e.g. Shelf Life)" className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary" />
                                                    <input type="text" value={row.value} onChange={(e) => handleDynamicChange('information', idx, 'value', e.target.value)} placeholder="Value" className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary" />
                                                    <button type="button" onClick={() => removeDynamicRow('information', idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Offers Section */}
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="font-bold text-gray-800">Coupons & Offers</h4>
                                            <button type="button" onClick={() => addDynamicRow('offers', { text: '', color: '#FF5733' })} className="text-xs font-black text-brand-primary uppercase tracking-widest flex items-center space-x-1">
                                                <Plus size={14} />
                                                <span>Add Offer</span>
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            {formData.offers.map((row, idx) => (
                                                <div key={idx} className="flex gap-3 items-center">
                                                    <input type="text" value={row.text} onChange={(e) => handleDynamicChange('offers', idx, 'text', e.target.value)} placeholder="Offer text (e.g. 10% Off)" className="flex-[3] px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary" />
                                                    <select 
                                                        value={row.color} 
                                                        onChange={(e) => handleDynamicChange('offers', idx, 'color', e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none font-bold"
                                                        style={{ color: row.color }}
                                                    >
                                                        <option value="#FF5733">Primary</option>
                                                        <option value="#00D4AA">Accent</option>
                                                        <option value="#3498db">Blue</option>
                                                        <option value="#e67e22">Orange</option>
                                                        <option value="#9b59b6">Purple</option>
                                                    </select>
                                                    <button type="button" onClick={() => removeDynamicRow('offers', idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 flex justify-end space-x-4 pt-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 font-bold text-text-muted hover:text-gray-800 transition-colors">Cancel</button>
                                    <button type="submit" className="btn-primary px-10">Save Product</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
};

export default AdminProducts;
