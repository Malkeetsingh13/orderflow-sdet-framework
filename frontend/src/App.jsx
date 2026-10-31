import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt_token') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('user_email') || '');
  const [currentView, setCurrentView] = useState('shop'); // 'shop' | 'cart' | 'login' | 'register' | 'orders' | 'specs' | 'admin'
  
  const [loginEmail, setLoginEmail] = useState('testuser@orderflow.com');
  const [loginPassword, setLoginPassword] = useState('mypassword123');
  
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // New Product Form State (Admin)
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setError('');
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setError('Could not connect to backend server. Ensure Spring Boot is running on port 8080.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      const jwt = response.data.token;
      localStorage.setItem('jwt_token', jwt);
      localStorage.setItem('user_email', loginEmail);
      setToken(jwt);
      setUserEmail(loginEmail);
      setSuccessMsg('Successfully logged in!');
      setCurrentView('shop');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Check your credentials.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.post('/auth/register', { fullName: regFullName, email: regEmail, password: regPassword });
      setSuccessMsg('Registration successful! Please sign in.');
      setCurrentView('login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_email');
    setToken('');
    setUserEmail('');
    setCart([]);
    setCurrentView('shop');
    setSuccessMsg('Logged out successfully.');
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.post('/products', {
        name: newProdName,
        sku: newProdSku,
        price: parseFloat(newProdPrice),
        stockQuantity: parseInt(newProdStock),
        description: newProdDesc
      });
      setSuccessMsg('Product created successfully and added to catalog!');
      setNewProdName('');
      setNewProdSku('');
      setNewProdPrice('');
      setNewProdStock('');
      setNewProdDesc('');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create product. Check SKU uniqueness.');
    }
  };

  const handleRestock = async (productId, currentStock) => {
    const addQty = prompt('Enter quantity to restock:', '10');
    if (!addQty) return;
    try {
      setError('');
      await api.patch(`/products/${productId}`, {
        stockQuantity: currentStock + parseInt(addQty)
      });
      setSuccessMsg('Inventory restocked successfully!');
      fetchProducts();
    } catch (err) {
      setError('Failed to update stock.');
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    setSuccessMsg(`Added ${product.name} to cart!`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (!token) {
      setCurrentView('login');
      setError('Please sign in to complete checkout.');
      return;
    }
    if (cart.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const primaryItem = cart[0];
      const response = await api.post('/orders', { productId: primaryItem.id, quantity: primaryItem.quantity });
      setOrders(prev => [response.data, ...prev]);
      setCart([]);
      setSuccessMsg('Order successfully placed through backend state machine!');
      setCurrentView('orders');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.exactReason || 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#090a0f', color: '#9ca3af' }}>
      
      {/* Top Header Navbar */}
      <header style={{ background: '#0d0f17', borderBottom: '1px solid #1e2230', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setCurrentView('shop')}>
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontWeight: 800, padding: '8px 12px', borderRadius: '8px', fontSize: '16px' }}>OF</span>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#f3f4f6' }}>OrderFlow<span style={{ color: '#6366f1' }}>.in</span></span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => setCurrentView('shop')} style={{ background: 'transparent', border: 'none', color: currentView === 'shop' ? '#6366f1' : '#9ca3af', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Storefront</button>
          <button onClick={() => setCurrentView('admin')} style={{ background: 'transparent', border: 'none', color: currentView === 'admin' ? '#6366f1' : '#9ca3af', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Admin Panel</button>
          <button onClick={() => setCurrentView('cart')} style={{ background: 'transparent', border: 'none', color: currentView === 'cart' ? '#6366f1' : '#9ca3af', fontWeight: 600, fontSize: '14px', cursor: 'pointer', position: 'relative' }}>
            Cart {totalCartItems > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '10px', fontWeight: 700, marginLeft: '4px' }}>{totalCartItems}</span>}
          </button>
          {token && <button onClick={() => setCurrentView('orders')} style={{ background: 'transparent', border: 'none', color: currentView === 'orders' ? '#6366f1' : '#9ca3af', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>My Orders</button>}

          {token ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: '#e5e7eb' }}>{userEmail}</span>
              <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCurrentView('login')} style={{ background: '#181b26', border: '1px solid #1e2230', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
              <button onClick={() => setCurrentView('register')} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Register</button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '30px 20px' }}>

        {successMsg && <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '8px', color: '#22c55e', fontSize: '14px', fontWeight: 500 }}>✨ {successMsg}</div>}
        {error && <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#ef4444', fontSize: '14px', fontWeight: 500 }}>⚠️ {error}</div>}

        {/* VIEW 1: STOREFRONT */}
        {currentView === 'shop' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              <div style={{ background: 'linear-gradient(135deg, #ea580c, #c2410c)', borderRadius: '16px', padding: '25px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <span style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Flash Deal</span>
                  <h2 style={{ fontSize: '24px', margin: '10px 0 5px', color: '#fff' }}>Mechanical Keyboards</h2>
                  <p style={{ fontSize: '13px', opacity: 0.9 }}>Up to 40% off on tactile switches & RGB setups.</p>
                </div>
                <button onClick={() => { document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' }); }} style={{ background: '#fff', color: '#c2410c', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, width: 'fit-content', cursor: 'pointer' }}>Shop Now →</button>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', borderRadius: '16px', padding: '25px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <span style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>SDET Verified</span>
                  <h2 style={{ fontSize: '24px', margin: '10px 0 5px', color: '#fff' }}>Transactional Safety</h2>
                  <p style={{ fontSize: '13px', opacity: 0.9 }}>Atomic inventory locking guaranteed on every order.</p>
                </div>
                <button onClick={() => setCurrentView('specs')} style={{ background: '#fff', color: '#1d4ed8', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, width: 'fit-content', cursor: 'pointer' }}>Explore Specs →</button>
              </div>

              <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', borderRadius: '16px', padding: '25px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                <div>
                  <span style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Instant JWT</span>
                  <h2 style={{ fontSize: '24px', margin: '10px 0 5px', color: '#fff' }}>Secure Checkout</h2>
                  <p style={{ fontSize: '13px', opacity: 0.9 }}>Protected by Spring Security filter chains.</p>
                </div>
                <button onClick={() => setCurrentView(token ? 'cart' : 'login')} style={{ background: '#fff', color: '#047857', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, width: 'fit-content', cursor: 'pointer' }}>Test Flow →</button>
              </div>
            </div>

            <div id="results-section">
              <h2 style={{ fontSize: '22px', marginBottom: '20px', borderBottom: '1px solid #1e2230', paddingBottom: '10px', color: '#f3f4f6' }}>Results & Live Inventory</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {products.map((product) => (
                  <div key={product.id} style={{ background: '#12141c', border: '1px solid #1e2230', borderRadius: '16px', padding: '24px', display: 'flex', gap: '30px', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                    
                    <div style={{ background: '#181b26', padding: '15px', borderRadius: '12px', border: '1px solid #1e2230', minWidth: '180px', height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '42px', marginBottom: '8px' }}>{product.name.toLowerCase().includes('mouse') ? '🖱️' : '⌨️'}</span>
                      <span style={{ fontSize: '10px', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase' }}>Verified Stock</span>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ background: '#374151', color: '#9ca3af', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>Sponsored</span>
                        <h3 style={{ fontSize: '18px', margin: '8px 0', color: '#f3f4f6', lineHeight: '130%' }}>{product.name}</h3>
                        <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '10px', lineHeight: '140%' }}>{product.description}</p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '10px' }}>
                          <span style={{ color: '#fbbf24', fontWeight: 700 }}>4.1 ★★★★★</span>
                          <span style={{ color: '#60a5fa' }}>(154)</span>
                          <span style={{ color: '#9ca3af' }}>• 1K+ bought in past month</span>
                        </div>

                        <div style={{ display: 'inline-block', background: '#be123c', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, marginBottom: '10px' }}>
                          Great Indian Festival
                        </div>

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '26px', fontWeight: 800, color: '#f3f4f6' }}>${product.price}</span>
                          <span style={{ fontSize: '13px', color: '#9ca3af', textDecoration: 'line-through' }}>M.R.P: ${(product.price * 1.35).toFixed(2)}</span>
                          <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>(36% off)</span>
                        </div>

                        <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600, marginBottom: '15px' }}>
                          FREE delivery <strong>Mon, 2 Nov</strong>. Arrives before Diwali.
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button 
                          onClick={() => addToCart(product)}
                          disabled={product.stockQuantity <= 0}
                          style={{ 
                            padding: '10px 30px', 
                            background: product.stockQuantity > 0 ? '#ffd814' : '#374151', 
                            color: product.stockQuantity > 0 ? '#0f1111' : '#9ca3af', 
                            border: '1px solid #fcd200', 
                            borderRadius: '20px', 
                            fontWeight: 700, 
                            fontSize: '14px',
                            cursor: product.stockQuantity > 0 ? 'pointer' : 'not-allowed',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                          }}
                        >
                          {product.stockQuantity > 0 ? 'Add to cart' : 'Out of stock'}
                        </button>
                        <span style={{ fontSize: '12px', color: product.stockQuantity > 5 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                          ● Stock: {product.stockQuantity}
                        </span>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ADMIN PANEL */}
        {currentView === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ background: '#12141c', padding: '30px', borderRadius: '16px', border: '1px solid #1e2230' }}>
              <h2 style={{ fontSize: '22px', marginBottom: '15px', color: '#f3f4f6' }}>🛠️ Admin Panel: Create New Product</h2>
              <form onSubmit={handleCreateProduct} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600 }}>Product Name</label>
                  <input type="text" value={newProdName} onChange={e => setNewProdName(e.target.value)} placeholder="Wireless Mechanical Keyboard" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600 }}>SKU</label>
                  <input type="text" value={newProdSku} onChange={e => setNewProdSku(e.target.value)} placeholder="KB-W-03" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600 }}>Price ($)</label>
                  <input type="number" step="0.01" value={newProdPrice} onChange={e => setNewProdPrice(e.target.value)} placeholder="89.99" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600 }}>Stock Quantity</label>
                  <input type="number" value={newProdStock} onChange={e => setNewProdStock(e.target.value)} placeholder="50" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff' }} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600 }}>Description</label>
                  <input type="text" value={newProdDesc} onChange={e => setNewProdDesc(e.target.value)} placeholder="Ergonomic mechanical keyboard with custom switches..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff' }} required />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" style={{ padding: '12px 25px', background: '#ffd814', color: '#0f1111', border: 'none', borderRadius: '20px', fontWeight: 700, cursor: 'pointer' }}>
                    + Publish Product to Catalog
                  </button>
                </div>
              </form>
            </div>

            <div style={{ background: '#12141c', padding: '30px', borderRadius: '16px', border: '1px solid #1e2230' }}>
              <h2 style={{ fontSize: '22px', marginBottom: '15px', color: '#f3f4f6' }}>📦 Inventory Restock Management</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {products.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181b26', padding: '15px', borderRadius: '10px', border: '1px solid #1e2230' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{p.name} <span style={{ fontSize: '12px', color: '#9ca3af' }}>({p.sku})</span></div>
                      <div style={{ fontSize: '13px', color: '#22c55e' }}>Stock Level: {p.stockQuantity} units | Price: ${p.price}</div>
                    </div>
                    <button onClick={() => handleRestock(p.id, p.stockQuantity)} style={{ padding: '8px 16px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                      Restock Stock ⚡
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: SPECS VIEW */}
        {currentView === 'specs' && (
          <div style={{ background: '#12141c', padding: '30px', borderRadius: '16px', border: '1px solid #1e2230' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '15px', color: '#f3f4f6' }}>SDET Architecture Specifications</h2>
            <p style={{ color: '#9ca3af', marginBottom: '25px' }}>Detailed technical design of the backend services powering this OrderFlow application.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#181b26', padding: '20px', borderRadius: '12px', border: '1px solid #1e2230' }}>
                <h3 style={{ fontSize: '16px', color: '#38bdf8', marginBottom: '8px' }}>Transactional Inventory Control</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Prevents race conditions and overselling during high-concurrency flash sales using database row-level locking.</p>
              </div>
              <div style={{ background: '#181b26', padding: '20px', borderRadius: '12px', border: '1px solid #1e2230' }}>
                <h3 style={{ fontSize: '16px', color: '#38bdf8', marginBottom: '8px' }}>Order State Machine</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Ensures strict lifecycle transitions (PENDING → PAID → SHIPPED → DELIVERED).</p>
              </div>
              <div style={{ background: '#181b26', padding: '20px', borderRadius: '12px', border: '1px solid #1e2230' }}>
                <h3 style={{ fontSize: '16px', color: '#38bdf8', marginBottom: '8px' }}>Immutable Audit Logging</h3>
                <p style={{ fontSize: '13px', color: '#9ca3af' }}>Tracks every state change and transaction request for auditing and compliance verification.</p>
              </div>
            </div>

            <button onClick={() => setCurrentView('shop')} style={{ marginTop: '25px', padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              ← Back to Storefront
            </button>
          </div>
        )}

        {/* VIEW 4: CART */}
        {currentView === 'cart' && (
          <div style={{ background: '#12141c', padding: '30px', borderRadius: '16px', border: '1px solid #1e2230' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#f3f4f6' }}>Shopping Cart</h2>
            {cart.length === 0 ? (
              <p style={{ fontSize: '14px' }}>Your cart is empty. <span style={{ color: '#6366f1', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setCurrentView('shop')}>Continue shopping</span></p>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181b26', padding: '15px', borderRadius: '10px', border: '1px solid #1e2230' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.name}</div>
                        <div style={{ fontSize: '13px', color: '#9ca3af' }}>${item.price} each</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => updateCartQuantity(item.id, -1)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #1e2230', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>-</button>
                          <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.id, 1)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #1e2230', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}>+</button>
                        </div>
                        <div style={{ fontWeight: 700, color: '#38bdf8', minWidth: '70px', textAlign: 'right' }}>
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid #1e2230', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#9ca3af' }}>Total Amount:</div>
                    <div style={{ fontSize: '26px', fontWeight: 700, color: '#38bdf8' }}>${cartTotal.toFixed(2)}</div>
                  </div>
                  <button 
                    onClick={handleCheckout}
                    disabled={loading}
                    style={{ padding: '12px 30px', background: '#ffd814', color: '#0f1111', border: '1px solid #fcd200', borderRadius: '20px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {loading ? 'Processing...' : 'Proceed to Secure Checkout'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: SIGN IN */}
        {currentView === 'login' && (
          <div style={{ maxWidth: '420px', margin: '40px auto', background: '#12141c', padding: '30px', borderRadius: '16px', border: '1px solid #1e2230', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '8px', textAlign: 'center', color: '#f3f4f6' }}>Sign In</h2>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Email</label>
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Password</label>
                <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff', boxSizing: 'border-box' }} required />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#ffd814', color: '#0f1111', border: 'none', borderRadius: '20px', fontWeight: 700, fontSize: '14px', marginTop: '10px', cursor: 'pointer' }}>Sign In</button>
            </form>
          </div>
        )}

        {/* VIEW 6: REGISTER */}
        {currentView === 'register' && (
          <div style={{ maxWidth: '420px', margin: '40px auto', background: '#12141c', padding: '30px', borderRadius: '16px', border: '1px solid #1e2230', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '8px', textAlign: 'center', color: '#f3f4f6' }}>Create Account</h2>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Full Name</label>
                <input type="text" value={regFullName} onChange={(e) => setRegFullName(e.target.value)} placeholder="John Doe" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Email</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="john@example.com" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff', boxSizing: 'border-box' }} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase' }}>Password</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #1e2230', background: '#181b26', color: '#fff', boxSizing: 'border-box' }} required />
              </div>
              <button type="submit" style={{ width: '100%', padding: '12px', background: '#ffd814', color: '#0f1111', border: 'none', borderRadius: '20px', fontWeight: 700, fontSize: '14px', marginTop: '10px', cursor: 'pointer' }}>Register</button>
            </form>
          </div>
        )}

        {/* VIEW 7: MY ORDERS */}
        {currentView === 'orders' && (
          <div style={{ background: '#12141c', padding: '30px', borderRadius: '16px', border: '1px solid #1e2230' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '20px', color: '#f3f4f6' }}>Order History & State Lifecycle</h2>
            {orders.length === 0 ? (
              <p style={{ fontSize: '14px' }}>No orders placed in this session yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ background: '#181b26', padding: '20px', borderRadius: '12px', border: '1px solid #1e2230' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#9ca3af' }}>Order UUID: {order.id}</span>
                      <span style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        Status: {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#f3f4f6' }}>Total Amount: ${order.totalAmount}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}