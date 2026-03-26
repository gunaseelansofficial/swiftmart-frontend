import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
    MapPin,
    Clock,
    CreditCard,
    Banknote,
    Plus,
    ShieldCheck,
    ChevronLeft,
    CheckCircle2,
    AlertCircle,
    Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../../components/shared/Navbar';
import LocationPickerModal from '../../components/shared/LocationPickerModal';
import api from '../../utils/api';
import { clearCart } from '../../store/slices/cartSlice';
import { setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import AddressFormModal from '../../components/shared/AddressFormModal';

const CheckoutPage = () => {
    const { items, totalAmount } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.auth);
    const { selectedLocation } = useSelector((state) => state.location);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [selectedAddress, setSelectedAddress] = useState(null);
    const [deliveryType, setDeliveryType] = useState('express');
    const [paymentMethod, setPaymentMethod] = useState('online');
    const [loading, setLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'Home',
        houseNo: '',
        floor: '', 
        landmark: '',
        phone: user?.phone || '',
        street: '',
        city: '',
        pincode: '',
        lat: 0,
        lng: 0,
        isDefault: false
    });

    const deliveryFee = totalAmount > 299 ? 0 : 40;
    const gst = Math.round(totalAmount * 0.05);
    const finalTotal = totalAmount + deliveryFee + gst;

    useEffect(() => {
        if (items.length === 0) {
            navigate('/cart');
        }
        if (user?.addresses?.length > 0 && !selectedAddress) {
            setSelectedAddress(user.addresses.find(a => a.isDefault)?._id || user.addresses[0]._id);
        }
    }, [items, user, navigate]);

    // Auto-populate when location is selected in header or changed
    useEffect(() => {
        if (selectedLocation) {
            setNewAddress(prev => ({
                ...prev,
                street: selectedLocation.address || selectedLocation.label || '',
                city: selectedLocation.city || '',
                pincode: selectedLocation.pincode || '',
                lat: selectedLocation.lat,
                lng: selectedLocation.lng
            }));
        }
    }, [selectedLocation]);

    const handleSaveAddress = async () => {
        if (!newAddress.houseNo || !newAddress.street || !newAddress.city || !newAddress.pincode) {
            toast.error('Please fill all required fields (House No, Area, City, Pincode)');
            return;
        }

        try {
            setLoading(true);
            // Combine detailed fields into street for the backend
            const combinedStreet = `${newAddress.houseNo}${newAddress.floor ? `, ${newAddress.floor}` : ''}, ${newAddress.street}${newAddress.landmark ? ` (Landmark: ${newAddress.landmark})` : ''}`;
            
            const { data } = await api.post('/auth/address', {
                ...newAddress,
                street: combinedStreet
            });

            if (data.success) {
                dispatch(setUser(data.user));
                setSelectedAddress(data.user.addresses[data.user.addresses.length - 1]._id);
                setShowAddressForm(false);
                setNewAddress({ label: 'Home', houseNo: '', floor: '', landmark: '', phone: user?.phone || '', street: '', city: '', pincode: '', isDefault: false });
                toast.success('Address saved successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save address');
        } finally {
            setLoading(false);
        }
    };

    const handleLocationPickerConfirm = (details) => {
        setNewAddress({
            ...newAddress,
            street: details.street,
            city: details.city,
            pincode: details.pincode,
            lat: details.lat,
            lng: details.lng
        });
        setShowLocationPicker(false);
        toast.success('Address details populated from map!');
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.error('Please select a delivery address');
            return;
        }

        setLoading(true);
        try {
            // STEP 1: Stock Validation
            const { data: validation } = await api.post('/cart/validate', {
                items: items.map(item => ({ product: item._id, quantity: item.quantity }))
            });

            if (!validation.success) {
                toast.error('Some items in your cart are out of stock');
                setLoading(false);
                return;
            }

            // STEP 2: Payment/Order Flow
            if (paymentMethod === 'online') {
                const { data: orderData } = await api.post('/orders/create-payment', { amount: finalTotal });

                const options = {
                    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                    amount: orderData.amount,
                    currency: 'INR',
                    name: 'SwiftMart',
                    description: 'Payment for your order',
                    order_id: orderData.id,
                    handler: async (response) => {
                        try {
                            const { data: verifyData } = await api.post('/orders/verify-payment', {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderItems: items.map(item => ({
                                    product: item._id,
                                    quantity: item.quantity,
                                    price: item.price
                                })),
                                shippingAddress: selectedAddress,
                                paymentMethod: 'razorpay',
                                deliveryType,
                                totalAmount: finalTotal
                            });

                            if (verifyData.success) {
                                navigate(`/order-success/${verifyData.orderId}`);
                            }
                        } catch (err) {
                            toast.error('Payment verification failed');
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                        contact: user.phone
                    },
                    theme: { color: '#FF5733' }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                const { data } = await api.post('/orders', {
                    orderItems: items.map(item => ({
                        product: item._id,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    shippingAddress: selectedAddress,
                    paymentMethod,
                    deliveryType,
                    totalAmount: finalTotal
                });

                navigate(`/order-success/${data.order._id}`);
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                error.response.data.errors.forEach(err => toast.error(err.message));
            } else {
                toast.error(error.response?.data?.message || 'Failed to place order');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg transition-colors">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">
                    <Link to="/cart" className="hover:text-brand-primary flex items-center"><ChevronLeft size={14} className="mr-1" /> Back to Cart</Link>
                    <span className="text-gray-200 dark:text-white/10">/</span>
                    <span className="text-gray-600 dark:text-gray-400">Secure Checkout</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 md:gap-12">
                    {/* Main Checkout content */}
                    <div className="flex-1 space-y-4 md:space-y-8 md:mb-0 mb-32">
                        {/* Step 1: Address */}
                        <section className="bg-white dark:bg-white/5 rounded-xl md:rounded-md p-5 md:p-8 shadow-sm md:shadow-card border border-gray-100 dark:border-white/5 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 md:mb-8 gap-4 sm:gap-0">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">1</div>
                                    <h2 className="text-xl font-heading font-extrabold text-gray-800 dark:text-white uppercase tracking-widest">Delivery Address</h2>
                                </div>
                                <button
                                    onClick={() => setShowAddressForm(!showAddressForm)}
                                    className="flex items-center space-x-2 text-xs font-bold text-brand-primary uppercase tracking-widest hover:underline w-fit sm:w-auto tap-target"
                                >
                                    <Plus size={14} />
                                    <span>Add New</span>
                                </button>
                            </div>

                            {!user?.addresses || user.addresses.length === 0 ? (
                                <div className="py-12 text-center bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-100 dark:border-white/10 text-gray-400">
                                    <MapPin size={40} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest mb-4">No addresses saved yet</p>
                                    <button 
                                        onClick={() => setShowAddressForm(true)}
                                        className="btn-primary px-8 py-3 rounded-xl text-xs"
                                    >
                                        Add Delivery Address
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    {user?.addresses?.map((addr) => (
                                        <motion.div
                                            key={addr._id}
                                            onClick={() => setSelectedAddress(addr._id)}
                                            className={`p-4 rounded-xl md:rounded-md border-2 cursor-pointer transition-all tap-target ${selectedAddress === addr._id
                                                ? 'border-brand-primary bg-brand-primary/5'
                                                : 'border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-white/5 hover:border-brand-primary/20'
                                                }`}
                                        >
                                            <div className="flex justify-between mb-2">
                                                <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{addr.label || addr.type}</span>
                                                {selectedAddress === addr._id && <CheckCircle2 size={16} className="text-brand-primary" />}
                                            </div>
                                            <p className="text-sm text-gray-800 dark:text-white font-bold mb-1">{addr.street}</p>
                                            <p className="text-xs text-text-muted dark:text-gray-400 mb-2">{addr.city}, {addr.pincode}</p>
                                            {addr.phone && (
                                                <div className="flex items-center space-x-2 text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 w-fit px-2 py-1 rounded">
                                                    <span>📞 {addr.phone}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Address Form Modal */}
                            <AddressFormModal
                                isOpen={showAddressForm}
                                onClose={() => setShowAddressForm(false)}
                                address={newAddress}
                                setAddress={setNewAddress}
                                onSave={handleSaveAddress}
                                onOpenLocationPicker={() => setShowLocationPicker(true)}
                                loading={loading}
                            />

                            {/* Location Picker Modal (stays as is, triggered from AddressFormModal) */}
                            <LocationPickerModal
                                isOpen={showLocationPicker}
                                onClose={() => setShowLocationPicker(false)}
                                onConfirm={handleLocationPickerConfirm}
                                initialLocation={newAddress.lat ? [newAddress.lat, newAddress.lng] : null}
                            />
                        </section>

                        {/* Step 2: Delivery Type */}
                        <section className="bg-white dark:bg-white/5 rounded-xl md:rounded-md p-5 md:p-8 shadow-sm md:shadow-card border border-gray-100 dark:border-white/5">
                            <div className="flex items-center space-x-3 mb-6 md:mb-8">
                                <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">2</div>
                                <h2 className="text-xl font-heading font-extrabold text-gray-800 dark:text-white uppercase tracking-widest">Delivery Type</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:gap-6">
                                <div className="flex items-center p-4 md:p-6 rounded-xl md:rounded-md border-2 transition-all border-brand-primary bg-brand-primary/5 shadow-lg">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-brand-primary text-white">
                                        <Clock size={24} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-800 dark:text-white">⚡ Express Delivery</p>
                                        <p className="text-xs text-text-muted dark:text-gray-400">In 10-15 minutes • Free above ₹299</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Step 3: Payment */}
                        <section className="bg-white dark:bg-white/5 rounded-xl md:rounded-md p-5 md:p-8 shadow-sm md:shadow-card border border-gray-100 dark:border-white/5">
                            <div className="flex items-center space-x-3 mb-6 md:mb-8">
                                <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">3</div>
                                <h2 className="text-xl font-heading font-extrabold text-gray-800 dark:text-white uppercase tracking-widest">Payment Method</h2>
                            </div>
                            <div className="space-y-3 md:space-y-4">
                                {[
                                    { id: 'online', name: 'Pay Online (Razorpay)', icon: <CreditCard size={20} />, sub: 'Credit/Debit Card, UPI, Netbanking' },
                                    { id: 'cod', name: 'Cash on Delivery', icon: <Banknote size={20} />, sub: 'Pay when your items arrive' }
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`w-full flex items-center p-4 rounded-xl md:rounded-md border-2 transition-all tap-target ${paymentMethod === method.id
                                            ? 'border-brand-primary bg-brand-primary/5'
                                            : 'border-gray-50 dark:border-white/5 bg-gray-50 dark:bg-white/5'
                                            }`}
                                    >
                                        <div className={`mr-4 ${paymentMethod === method.id ? 'text-brand-primary' : 'text-gray-400'}`}>
                                            {method.icon}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-bold text-gray-800 dark:text-white text-sm">{method.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{method.sub}</p>
                                        </div>
                                        {paymentMethod === method.id && <CheckCircle2 size={16} className="text-brand-primary" />}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Summary */}
                    <aside className="w-full lg:w-96 hidden md:block">
                        <div className="bg-white dark:bg-white/5 rounded-md p-8 shadow-card border border-gray-100 dark:border-white/5 sticky top-32">
                            <h4 className="font-bold text-gray-800 dark:text-white uppercase text-xs tracking-widest mb-6 border-b border-gray-50 dark:border-white/10 pb-4">Order Summary</h4>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2 scrollbar-none">
                                {items.map(item => (
                                    <div key={item._id} className="flex justify-between items-center text-sm">
                                        <span className="text-text-muted dark:text-gray-400 line-clamp-1 flex-1 pr-4">{item.name} <span className="font-bold ml-1">x{item.quantity}</span></span>
                                        <span className="font-bold text-gray-800 dark:text-white">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-6 border-t border-gray-50 dark:border-white/5 mb-10">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Bill Total</span>
                                    <span className="font-bold text-gray-400 line-through">₹{totalAmount + 150}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-600">
                                    <span className="font-medium">Total Savings</span>
                                    <span className="font-bold">-₹150</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Delivery Fee</span>
                                    <span className={`font-bold ${deliveryFee === 0 ? 'text-green-600' : 'text-gray-800 dark:text-white'}`}>
                                        {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">GST (5%)</span>
                                    <span className="font-bold text-gray-800 dark:text-white">₹{gst}</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100 dark:border-white/10">
                                    <span className="text-lg font-heading font-extrabold text-gray-800 dark:text-white">Grand Total</span>
                                    <span className="text-2xl font-heading font-extrabold text-brand-primary">₹{finalTotal}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="w-full btn-primary !py-4 flex items-center justify-center space-x-3 shadow-xl shadow-brand-primary/20"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <ShieldCheck size={20} />
                                        <span className="text-lg uppercase tracking-widest">Pay & Place Order</span>
                                    </>
                                )}
                            </button>

                            <div className="mt-8 flex items-center justify-center space-x-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest bg-gray-50 dark:bg-white/5 p-3 rounded">
                                <ShieldCheck size={14} className="text-brand-primary" />
                                <span>100% Encrypted Payments • Trusted by 10k+</span>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Mobile Fixed Bill Summary & Checkout */}
            <div className="md:hidden fixed bottom-[60px] left-0 w-full bg-white dark:bg-dark-bg border-t border-gray-100 dark:border-white/5 p-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-3xl space-y-4">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total Amount</span>
                        <span className="text-lg font-heading font-extrabold text-brand-primary leading-none">₹{finalTotal}</span>
                    </div>
                </div>

                <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center space-x-2 !py-4 px-6 rounded-2xl shadow-xl shadow-brand-primary/20 tap-target"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <ShieldCheck size={18} />
                            <span className="text-sm uppercase tracking-widest">Pay & Place Order</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default CheckoutPage;
