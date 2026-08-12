// Firebase Configuration
// IMPORTANT: Replace this with your own Firebase config from Firebase Console
// Go to: https://console.firebase.google.com/
// 1. Create a new project
// 2. Go to Project Settings > General > Your apps > Web app
// 3. Copy the firebaseConfig object and replace below
const firebaseConfig = {
  apiKey: "AIzaSyBLAI8Enu-SEwINh52RqS0iO8I-0AFhYS8",
  authDomain: "ramz-e-takhleeq.firebaseapp.com",
  databaseURL: "https://ramz-e-takhleeq-default-rtdb.firebaseio.com",
  projectId: "ramz-e-takhleeq",
  storageBucket: "ramz-e-takhleeq.firebasestorage.app",
  messagingSenderId: "204404301642",
  appId: "1:204404301642:web:f6d609749cdd10a9adebb3"
};

// Initialize Firebase
let database = null;
let isFirebaseEnabled = false;

try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        isFirebaseEnabled = true;
        console.log('✓ Firebase connected - Cloud sync enabled');
    } else {
        console.log('⚠ Firebase not configured - Using localStorage only');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    console.log('⚠ Falling back to localStorage');
}

// UI Notification & Status Helpers
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

function updateSyncBadge(status, text, title) {
    const badge = document.getElementById('syncStatusBadge');
    if (!badge) return;
    badge.className = `sync-badge ${status}`;
    badge.textContent = text;
    if (title) badge.title = title;
}

// Data Storage
let currentUser = null;
let cart = [];
let products = [];
let categories = [];
let receipts = [];

// Initialize App
function init() {
    // Restore session immediately if available
    try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            currentUser = JSON.parse(storedUser);
            showMainApp();
        }
    } catch (e) {
        console.error('Session restore error:', e);
    }

    loadData().then(() => {
        initializeDefaultData();
        checkAuth();
        
        // Set up real-time sync listener if Firebase is enabled
        if (isFirebaseEnabled && database) {
            console.log('✓ Setting up real-time Firebase sync');
            database.ref('billingData').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    products = data.products || [];
                    categories = data.categories || [];
                    receipts = data.receipts || [];
                    console.log('✓ Real-time update received - Products:', products.length);
                    
                    // Update UI if logged in
                    if (currentUser) {
                        const activeTab = document.querySelector('.tab-content.active');
                        if (activeTab) {
                            const tabId = activeTab.id;
                            if (tabId === 'billingTab') {
                                renderProducts();
                                updateCart();
                            } else if (tabId === 'dashboardTab') {
                                updateDashboard();
                            } else if (tabId === 'receiptsTab') {
                                renderReceipts();
                            } else if (tabId === 'productsTab') {
                                renderProductManagement();
                            }
                        }
                    }
                }
            }, (error) => {
                console.warn('Firebase real-time sync error:', error);
                updateSyncBadge('local', '🟡 Saved Locally', 'Real-time sync error: ' + (error.message || 'Offline'));
            });
        }
    });
}

// Authentication
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    if (!username) {
        errorEl.textContent = 'Please select a user';
        return;
    }

    // Default credentials
    const users = {
        admin: { password: 'admin123', role: 'admin' },
        biller: { password: 'biller123', role: 'biller' }
    };

    if (users[username] && users[username].password === password) {
        currentUser = {
            username: username,
            role: users[username].role
        };
        saveData();
        showMainApp();
        errorEl.textContent = '';
    } else {
        errorEl.textContent = 'Invalid username or password';
    }
}

function logout() {
    currentUser = null;
    cart = [];
    localStorage.removeItem('currentUser');
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('loginScreen').classList.add('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('loginError').textContent = '';
}

function showMainApp() {
    document.getElementById('loginScreen').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
    document.getElementById('currentUser').textContent = `${currentUser.username} (${currentUser.role})`;
    
    // Apply admin class to body if admin
    if (currentUser.role === 'admin') {
        document.body.classList.add('admin');
    } else {
        document.body.classList.remove('admin');
    }
    
    console.log('Loaded products count:', products.length);
    console.log('Loaded categories count:', categories.length);
    console.log('Loaded receipts count:', receipts.length);
    
    const savedFixedCost = localStorage.getItem('defaultFixedOrderCost');
    const fixedCostEl = document.getElementById('fixedOrderCost');
    if (fixedCostEl && savedFixedCost !== null) {
        fixedCostEl.value = savedFixedCost;
    }
    
    switchTab('billing');
    updateCategoryFilters();
    renderProducts();
}

function checkAuth() {
    // Show Firebase status
    const statusEl = document.getElementById('firebaseStatus');
    if (statusEl) {
        if (isFirebaseEnabled) {
            // Test Firebase connection
            database.ref('.info/connected').on('value', (snapshot) => {
                if (snapshot.val() === true) {
                    statusEl.innerHTML = '✓ Cloud sync ACTIVE & CONNECTED';
                    statusEl.style.color = 'var(--primary-green)';
                    console.log('✓ Firebase is connected and working');
                } else {
                    statusEl.innerHTML = '⚠ Cloud sync enabled but NOT CONNECTED';
                    statusEl.style.color = '#e67e22';
                    console.error('✗ Firebase not connected');
                }
            });
        } else {
            statusEl.innerHTML = '⚠ Cloud sync not configured - <a href="#" onclick="showFirebaseInstructions(); return false;">Setup Instructions</a>';
            statusEl.style.color = '#e67e22';
        }
    }
    
    if (currentUser) {
        showMainApp();
    }
}

// Tab Management
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // Update content based on tab
    if (tabName === 'dashboard') {
        updateDashboard();
    } else if (tabName === 'receipts') {
        renderReceipts();
    } else if (tabName === 'products') {
        renderProductManagement();
    } else if (tabName === 'billing') {
        renderProducts();
        updateCart();
    }
}

// Initialize Default Data
function initializeDefaultData() {
    let seeded = false;
    if (categories.length === 0) {
        categories = [
            { id: 1, name: 'Diaries' },
            { id: 2, name: 'Pocket Diaries' },
            { id: 3, name: 'Cards' },
            { id: 4, name: 'Ramzan Calendar' },
            { id: 5, name: '2026 Calendars' },
            { id: 6, name: 'Bookmarks' },
            { id: 7, name: 'Counters' },
            { id: 8, name: 'Stickers' },
            { id: 9, name: 'Crochet' },
            { id: 10, name: 'Baking' },
            { id: 11, name: 'Jewelry' }
        ];
        seeded = true;
    }
    
    if (products.length === 0) {
        products = [
            // Diaries
            ...Array.from({ length: 12 }, (_, i) => ({
                id: Date.now() + i,
                categoryId: 1,
                name: `A5-${String(i + 1).padStart(3, '0')}`,
                costPrice: 350,
                salePrice: 600,
                soldCount: 0
            })),
            // Pocket Diaries
            ...Array.from({ length: 12 }, (_, i) => ({
                id: Date.now() + 50 + i,
                categoryId: 2,
                name: `PD-${String(i + 1).padStart(3, '0')}`,
                costPrice: 60,
                salePrice: 150,
                soldCount: 0
            })),
            // Cards
            { id: Date.now() + 100, categoryId: 3, name: 'Small', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 101, categoryId: 3, name: 'Medium', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 102, categoryId: 3, name: 'Large', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 103, categoryId: 3, name: 'XL', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 104, categoryId: 3, name: 'XXL', costPrice: 0, salePrice: 0, soldCount: 0 },
            // Ramzan Calendar
            { id: Date.now() + 200, categoryId: 4, name: 'A4', costPrice: 70, salePrice: 150, soldCount: 0 },
            { id: Date.now() + 201, categoryId: 4, name: 'Small without stand', costPrice: 25, salePrice: 100, soldCount: 0 },
            { id: Date.now() + 202, categoryId: 4, name: 'Small with stand', costPrice: 155, salePrice: 350, soldCount: 0 },
            // 2026 Calendars
            ...Array.from({ length: 10 }, (_, i) => ({
                id: Date.now() + 300 + i,
                categoryId: 5,
                name: `DC-${String(i + 1).padStart(3, '0')}`,
                costPrice: 450,
                salePrice: 1000,
                soldCount: 0
            })),
            // Bookmarks
            { id: Date.now() + 400, categoryId: 6, name: 'Printed', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 401, categoryId: 6, name: 'Hand made', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 402, categoryId: 6, name: 'Ramzan Juz Tracker', costPrice: 0, salePrice: 0, soldCount: 0 },
            // Counters
            { id: Date.now() + 450, categoryId: 7, name: 'Universal', costPrice: 0, salePrice: 0, soldCount: 0 },
            // Stickers
            { id: Date.now() + 460, categoryId: 8, name: 'Universal', costPrice: 0, salePrice: 0, soldCount: 0 },
            // Crochet items
            { id: Date.now() + 500, categoryId: 9, name: 'Bandana Type 1', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 501, categoryId: 9, name: 'Bandana Type 2', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 502, categoryId: 9, name: 'Bandana Type 3', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 503, categoryId: 9, name: 'Head Band', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 504, categoryId: 9, name: 'Gloves Type 1', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 505, categoryId: 9, name: 'Gloves Type 2', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 506, categoryId: 9, name: 'Gloves Type 3', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 507, categoryId: 9, name: 'Wallet', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 508, categoryId: 9, name: 'Keychain Type 1', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 509, categoryId: 9, name: 'Keychain Type 2', costPrice: 0, salePrice: 0, soldCount: 0 },
            { id: Date.now() + 510, categoryId: 9, name: 'Keychain Type 3', costPrice: 0, salePrice: 0, soldCount: 0 },
            // Baking
            { id: Date.now() + 600, categoryId: 10, name: 'Universal', costPrice: 0, salePrice: 0, soldCount: 0 },
            // Jewelry
            { id: Date.now() + 700, categoryId: 11, name: 'Universal', costPrice: 0, salePrice: 0, soldCount: 0 }
        ];
        seeded = true;
    }
    
    if (seeded) {
        saveData();
    }
}

// Product Display and Filtering
function updateCategoryFilters() {
    const filters = [
        document.getElementById('categoryFilter'),
        document.getElementById('dashboardCategoryFilter'),
        document.getElementById('productCategory'),
        document.getElementById('productManagementCategoryFilter')
    ];
    
    filters.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        
        if (select.id === 'productCategory') {
            select.innerHTML = '<option value="">Select Category</option>';
        } else {
            select.innerHTML = '<option value="all">All Categories</option>';
        }
        
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
        
        if (currentValue) select.value = currentValue;
    });
}

function filterProducts() {
    renderProducts();
}

function renderProducts() {
    const filter = document.getElementById('categoryFilter').value;
    const searchTerm = document.getElementById('productSearch') ? document.getElementById('productSearch').value.toLowerCase() : '';
    const productList = document.getElementById('productList');
    
    let filteredProducts = products;
    
    // Filter by category
    if (filter !== 'all') {
        filteredProducts = products.filter(p => p.categoryId == filter);
    }
    
    // Filter by search term (name or ID)
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchTerm)
        );
    }
    
    productList.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const category = categories.find(c => c.id === product.categoryId);
        const div = document.createElement('div');
        div.className = 'product-item';
        div.onclick = () => addToCart(product.id);
        div.innerHTML = `
            <div class="product-item-header">
                <span class="product-item-name">${product.name}</span>
                <span class="product-item-category">${category ? category.name : 'Unknown'}</span>
            </div>
            <div class="product-item-prices">
                <span>Cost: Rs. ${product.costPrice.toFixed(2)}</span>
                <span>Sale: Rs. ${product.salePrice.toFixed(2)}</span>
            </div>
        `;
        productList.appendChild(div);
    });
}

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            productId: productId,
            quantity: 1,
            salePrice: product.salePrice
        });
    }
    
    updateCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    updateCart();
}

function updateCartItem(productId, field, value) {
    const item = cart.find(item => item.productId === productId);
    if (!item) return;
    
    if (field === 'quantity') {
        item.quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === 'salePrice') {
        item.salePrice = Math.max(0, parseFloat(value) || 0);
    }
    
    updateCart();
}

function updateCart() {
    const cartItems = document.getElementById('cartItems');
    cartItems.innerHTML = '';
    
    let totalCost = 0;
    let totalSale = 0;
    
    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;
        
        const category = categories.find(c => c.id === product.categoryId);
        const itemCost = product.costPrice * item.quantity;
        const itemSale = item.salePrice * item.quantity;
        const itemProfit = itemSale - itemCost;
        
        totalCost += itemCost;
        subtotalSale += itemSale;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-header">
                <span class="cart-item-name">${product.name} (${category ? category.name : 'Unknown'})</span>
                <button class="cart-item-remove" onclick="removeFromCart(${item.productId})">Remove</button>
            </div>
            <div class="cart-item-controls">
                <div>
                    <label>Quantity:</label>
                    <input type="number" min="1" value="${item.quantity}" 
                           onchange="updateCartItem(${item.productId}, 'quantity', this.value)">
                </div>
                <div>
                    <label>Sale Price (each):</label>
                    <input type="number" step="0.01" min="0" value="${item.salePrice}" 
                           onchange="updateCartItem(${item.productId}, 'salePrice', this.value)">
                </div>
            </div>
            <div class="cart-item-totals">
                <span>Cost: Rs. ${itemCost.toFixed(2)}</span>
                <span>Sale: Rs. ${itemSale.toFixed(2)}</span>
                <span style="color: var(--primary-green); font-weight: 600;">Profit: Rs. ${itemProfit.toFixed(2)}</span>
            </div>
        `;
        cartItems.appendChild(div);
    });
    
    // Process Discount & Fixed Order Expense
    const discountType = document.getElementById('discountType')?.value || 'fixed';
    const discountValue = parseFloat(document.getElementById('discountValue')?.value) || 0;
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
        discountAmount = (subtotalSale * Math.min(discountValue, 100)) / 100;
    } else {
        discountAmount = Math.min(discountValue, subtotalSale);
    }
    
    const fixedOrderCostInput = document.getElementById('fixedOrderCost');
    let fixedOrderCost = parseFloat(fixedOrderCostInput?.value);
    if (isNaN(fixedOrderCost)) fixedOrderCost = 20;
    
    // Save preferred default fixed order fee locally
    try {
        localStorage.setItem('defaultFixedOrderCost', fixedOrderCost.toString());
    } catch(e) {}
    
    const productBaseCost = totalCost;
    const combinedTotalCost = productBaseCost + fixedOrderCost;
    const finalSale = Math.max(0, subtotalSale - discountAmount);
    const totalProfit = finalSale - combinedTotalCost;
    
    const subtotalEl = document.getElementById('subtotalSale');
    if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotalSale.toFixed(2)}`;
    
    const productCostEl = document.getElementById('productCostDisplay');
    if (productCostEl) productCostEl.textContent = `Rs. ${productBaseCost.toFixed(2)}`;
    
    const fixedCostEl = document.getElementById('fixedCostDisplay');
    if (fixedCostEl) fixedCostEl.textContent = `Rs. ${fixedOrderCost.toFixed(2)}`;
    
    document.getElementById('totalCost').textContent = `Rs. ${combinedTotalCost.toFixed(2)}`;
    document.getElementById('totalSale').textContent = `Rs. ${finalSale.toFixed(2)}`;
    document.getElementById('totalProfit').textContent = `Rs. ${totalProfit.toFixed(2)}`;
    
    const discountRow = document.getElementById('discountRow');
    if (discountRow) {
        if (discountAmount > 0) {
            discountRow.style.display = 'flex';
            document.getElementById('discountAmountDisplay').textContent = `- Rs. ${discountAmount.toFixed(2)}`;
        } else {
            discountRow.style.display = 'none';
        }
    }
}

function clearCart() {
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        updateCart();
    }
}

// Receipt Generation
function generateReceipt() {
    if (cart.length === 0) {
        showToast('Cart is empty!', 'warning');
        return;
    }
    
    const discountType = document.getElementById('discountType')?.value || 'fixed';
    const discountValue = parseFloat(document.getElementById('discountValue')?.value) || 0;
    const paymentMethod = document.getElementById('paymentMethod')?.value || 'Cash';
    
    const fixedOrderCostInput = document.getElementById('fixedOrderCost');
    let fixedOrderCost = parseFloat(fixedOrderCostInput?.value);
    if (isNaN(fixedOrderCost)) fixedOrderCost = 20;
    
    let subtotalSale = 0;
    let productBaseCost = 0;
    
    const items = cart.map(item => {
        const product = products.find(p => p.id === item.productId);
        const cost = product ? product.costPrice : 0;
        productBaseCost += cost * item.quantity;
        subtotalSale += item.salePrice * item.quantity;
        return {
            productId: item.productId,
            productName: product ? product.name : 'Unknown',
            categoryId: product ? product.categoryId : null,
            quantity: item.quantity,
            costPrice: cost,
            salePrice: item.salePrice
        };
    });
    
    let discountAmount = 0;
    if (discountType === 'percentage') {
        discountAmount = (subtotalSale * Math.min(discountValue, 100)) / 100;
    } else {
        discountAmount = Math.min(discountValue, subtotalSale);
    }
    
    const combinedTotalCost = productBaseCost + fixedOrderCost;
    const finalSale = Math.max(0, subtotalSale - discountAmount);
    const totalProfit = finalSale - combinedTotalCost;
    
    const receipt = {
        id: 'REC-' + Date.now(),
        date: new Date().toISOString(),
        user: currentUser.username,
        paymentMethod: paymentMethod,
        discountType: discountType,
        discountValue: discountValue,
        discountAmount: discountAmount,
        fixedOrderCost: fixedOrderCost,
        productBaseCost: productBaseCost,
        subtotalSale: subtotalSale,
        totalCost: combinedTotalCost,
        totalSale: finalSale,
        totalProfit: totalProfit,
        items: items
    };
    
    // Update product sold counts
    receipt.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.soldCount = (product.soldCount || 0) + item.quantity;
        }
    });
    
    receipts.push(receipt);
    saveData();
    
    // Clear cart & reset discount input
    cart = [];
    const discInput = document.getElementById('discountValue');
    if (discInput) discInput.value = '0';
    updateCart();
    
    showCustomerReceipt(receipt);
    showToast('✓ Receipt Generated Successfully!', 'success');
}

function showCustomerReceipt(receipt) {
    const receiptContent = document.getElementById('receiptContent');
    const date = new Date(receipt.date);
    
    let itemsHTML = '';
    receipt.items.forEach(item => {
        const category = categories.find(c => c.id === item.categoryId);
        itemsHTML += `
            <div class="receipt-item-row">
                <div>
                    <strong>${item.productName}</strong> (${category ? category.name : 'Unknown'})<br>
                    <small>${item.quantity} x Rs. ${item.salePrice.toFixed(2)}</small>
                </div>
                <div><strong>Rs. ${(item.quantity * item.salePrice).toFixed(2)}</strong></div>
            </div>
        `;
    });
    
    let discountHTML = '';
    if (receipt.discountAmount && receipt.discountAmount > 0) {
        discountHTML = `
            <div class="receipt-total-row" style="color: #c0392b;">
                <span>Discount (${receipt.discountType === 'percentage' ? receipt.discountValue + '%' : 'Fixed'}):</span>
                <span>- Rs. ${receipt.discountAmount.toFixed(2)}</span>
            </div>
        `;
    }
    
    receiptContent.innerHTML = `
        <div class="receipt-header-print">
            <h2>Ramz E Takhleeq</h2>
            <p>Receipt #${receipt.id}</p>
            <p>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
            <p>Payment Method: <strong>${receipt.paymentMethod || 'Cash'}</strong></p>
        </div>
        <div class="receipt-items">
            ${itemsHTML}
        </div>
        <div class="receipt-totals">
            ${receipt.subtotalSale ? `<div class="receipt-total-row"><span>Subtotal:</span><span>Rs. ${receipt.subtotalSale.toFixed(2)}</span></div>` : ''}
            ${discountHTML}
            <div class="receipt-total-row grand">
                <span>Total Amount:</span>
                <span>Rs. ${receipt.totalSale.toFixed(2)}</span>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #333;">
            <p>Thank you for your business!</p>
        </div>
    `;
    
    document.getElementById('receiptModal').classList.add('active');
}

function showReceipt(receipt) {
    const receiptContent = document.getElementById('receiptContent');
    const date = new Date(receipt.date);
    
    let itemsHTML = '';
    receipt.items.forEach(item => {
        const category = categories.find(c => c.id === item.categoryId);
        itemsHTML += `
            <div class="receipt-item-row">
                <div>
                    <strong>${item.productName}</strong> (${category ? category.name : 'Unknown'})<br>
                    <small>${item.quantity} x Rs. ${item.salePrice.toFixed(2)}</small>
                </div>
                <div><strong>Rs. ${(item.quantity * item.salePrice).toFixed(2)}</strong></div>
            </div>
        `;
    });
    
    let discountHTML = '';
    if (receipt.discountAmount && receipt.discountAmount > 0) {
        discountHTML = `
            <div class="receipt-total-row" style="color: #c0392b;">
                <span>Discount (${receipt.discountType === 'percentage' ? receipt.discountValue + '%' : 'Fixed'}):</span>
                <span>- Rs. ${receipt.discountAmount.toFixed(2)}</span>
            </div>
        `;
    }
    
    receiptContent.innerHTML = `
        <div class="receipt-header-print">
            <h2>Ramz E Takhleeq</h2>
            <p>Receipt #${receipt.id}</p>
            <p>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</p>
            <p>Billed by: ${receipt.user} | Method: <strong>${receipt.paymentMethod || 'Cash'}</strong></p>
        </div>
        <div class="receipt-items">
            ${itemsHTML}
        </div>
        <div class="receipt-totals">
            <div class="receipt-total-row">
                <span>Total Cost:</span>
                <span>Rs. ${receipt.totalCost.toFixed(2)}</span>
            </div>
            ${receipt.subtotalSale ? `<div class="receipt-total-row"><span>Subtotal:</span><span>Rs. ${receipt.subtotalSale.toFixed(2)}</span></div>` : ''}
            ${discountHTML}
            <div class="receipt-total-row">
                <span>Total Sale:</span>
                <span>Rs. ${receipt.totalSale.toFixed(2)}</span>
            </div>
            <div class="receipt-total-row grand">
                <span>Profit:</span>
                <span>Rs. ${receipt.totalProfit.toFixed(2)}</span>
            </div>
        </div>
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #333;">
            <p>Thank you for your business!</p>
        </div>
    `;
    
    document.getElementById('receiptModal').classList.add('active');
}

function printReceipt() {
    window.print();
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.remove('active');
}

// Receipt History
function renderReceipts() {
    const receiptsList = document.getElementById('receiptsList');
    const dateFilter = document.getElementById('dateFilter').value;
    
    let filteredReceipts = receipts;
    if (dateFilter) {
        filteredReceipts = receipts.filter(receipt => {
            const receiptDate = new Date(receipt.date).toISOString().split('T')[0];
            return receiptDate === dateFilter;
        });
    }
    
    receiptsList.innerHTML = '';
    
    // Sort by date descending
    filteredReceipts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredReceipts.forEach(receipt => {
        const date = new Date(receipt.date);
        const pMethod = receipt.paymentMethod || 'Cash';
        const badgeClass = pMethod === 'Online' ? 'badge-online' : 'badge-cash';
        
        const div = document.createElement('div');
        div.className = 'receipt-card';
        div.innerHTML = `
            <div class="receipt-header">
                <span class="receipt-id">${receipt.id}</span>
                <span class="${badgeClass}">${pMethod === 'Online' ? '💳 Online' : '💵 Cash'}</span>
                <span class="receipt-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>
            </div>
            <div class="receipt-summary">
                <div>
                    <span>Items</span>
                    <strong>${receipt.items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                </div>
                <div>
                    <span>Total Sale</span>
                    <strong>Rs. ${receipt.totalSale.toFixed(2)}</strong>
                </div>
                <div>
                    <span>Profit</span>
                    <strong style="color: var(--primary-green);">Rs. ${receipt.totalProfit.toFixed(2)}</strong>
                </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button onclick="showReceipt(receipts.find(r => r.id === '${receipt.id}'))" class="btn-secondary" style="flex: 1; padding: 8px;">View Full Details</button>
                <button onclick="showCustomerReceipt(receipts.find(r => r.id === '${receipt.id}'))" class="btn-primary" style="flex: 1; padding: 8px;">Customer Receipt</button>
            </div>
        `;
        receiptsList.appendChild(div);
    });
    
    if (filteredReceipts.length === 0) {
        receiptsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No receipts found</p>';
    }
}

function filterReceipts() {
    renderReceipts();
}

function clearDateFilter() {
    document.getElementById('dateFilter').value = '';
    renderReceipts();
}

function deleteAllReceipts() {
    if (!confirm('Are you sure you want to delete ALL receipt records? This will also reset all product sold counts. This action cannot be undone!')) {
        return;
    }
    
    if (!confirm('FINAL WARNING: This will permanently delete all receipts and reset sales data. Continue?')) {
        return;
    }
    
    // Reset all product sold counts
    products.forEach(product => {
        product.soldCount = 0;
    });
    
    // Clear all receipts
    receipts = [];
    
    saveData();
    renderReceipts();
    showToast('All receipts have been deleted.', 'info');
}

// Dashboard Date Range Filter Logic
function handleDatePresetChange() {
    const preset = document.getElementById('dateRangePreset')?.value || 'all';
    const customInputs = document.getElementById('customDateInputs');
    if (customInputs) {
        customInputs.style.display = preset === 'custom' ? 'flex' : 'none';
    }
    updateDashboard();
}

function getFilteredReceiptsByDate() {
    const preset = document.getElementById('dateRangePreset')?.value || 'today';
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (preset === 'all') return receipts;
    
    if (preset === 'today') {
        return receipts.filter(r => new Date(r.date).toISOString().split('T')[0] === todayStr);
    }
    
    if (preset === 'yesterday') {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const yStr = y.toISOString().split('T')[0];
        return receipts.filter(r => new Date(r.date).toISOString().split('T')[0] === yStr);
    }
    
    if (preset === 'thisWeek') {
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay() || 7;
        startOfWeek.setDate(startOfWeek.getDate() - day + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        return receipts.filter(r => new Date(r.date) >= startOfWeek);
    }
    
    if (preset === 'thisMonth') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return receipts.filter(r => new Date(r.date) >= startOfMonth);
    }
    
    if (preset === 'custom') {
        const start = document.getElementById('dashStartDate')?.value;
        const end = document.getElementById('dashEndDate')?.value;
        return receipts.filter(r => {
            const rDate = new Date(r.date).toISOString().split('T')[0];
            if (start && rDate < start) return false;
            if (end && rDate > end) return false;
            return true;
        });
    }
    
    return receipts;
}

// Upgraded Dashboard
function updateDashboard() {
    const categoryFilter = document.getElementById('dashboardCategoryFilter')?.value || 'all';
    const dateFilteredReceipts = getFilteredReceiptsByDate();
    
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCost = 0;
    let cashRevenue = 0;
    let onlineRevenue = 0;
    let totalItemsSold = 0;
    
    // Product sold quantities for filtered range
    const productSoldMap = {};
    
    dateFilteredReceipts.forEach(receipt => {
        const pMethod = receipt.paymentMethod || 'Cash';
        
        let receiptItemRevenue = 0;
        let receiptItemCost = 0;
        
        receipt.items.forEach(item => {
            if (categoryFilter !== 'all') {
                const product = products.find(p => p.id === item.productId);
                if (!product || product.categoryId != categoryFilter) return;
            }
            
            const iRev = item.salePrice * item.quantity;
            const iCost = item.costPrice * item.quantity;
            
            receiptItemRevenue += iRev;
            receiptItemCost += iCost;
            totalItemsSold += item.quantity;
            
            productSoldMap[item.productId] = (productSoldMap[item.productId] || 0) + item.quantity;
        });
        
        // Subtract receipt discount if filtering all categories
        let finalReceiptRevenue = receiptItemRevenue;
        if (categoryFilter === 'all' && receipt.discountAmount) {
            finalReceiptRevenue = Math.max(0, receiptItemRevenue - receipt.discountAmount);
        }
        
        const receiptProfit = finalReceiptRevenue - receiptItemCost;
        
        totalRevenue += finalReceiptRevenue;
        totalCost += receiptItemCost;
        totalProfit += receiptProfit;
        
        if (pMethod === 'Online') {
            onlineRevenue += finalReceiptRevenue;
        } else {
            cashRevenue += finalReceiptRevenue;
        }
    });
    
    const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const avgBillValue = dateFilteredReceipts.length > 0 ? totalRevenue / dateFilteredReceipts.length : 0;
    
    // Update KPI UI Elements
    document.getElementById('totalRevenue').textContent = `Rs. ${totalRevenue.toFixed(2)}`;
    document.getElementById('revenueSubtext').textContent = `Cash: Rs. ${cashRevenue.toFixed(2)} | Online: Rs. ${onlineRevenue.toFixed(2)}`;
    
    document.getElementById('dashboardProfit').textContent = `Rs. ${totalProfit.toFixed(2)}`;
    const marginBadge = document.getElementById('marginBadge');
    if (marginBadge) marginBadge.textContent = `${marginPct.toFixed(1)}% Margin`;
    document.getElementById('profitSubtext').textContent = `Est. Profit Margin: ${marginPct.toFixed(1)}%`;
    
    document.getElementById('cashInHand').textContent = `Rs. ${totalCost.toFixed(2)}`;
    document.getElementById('costSubtext').textContent = `Product Base Cost: Rs. ${totalCost.toFixed(2)}`;
    
    document.getElementById('totalItemsSold').textContent = dateFilteredReceipts.length;
    document.getElementById('avgBillSubtext').textContent = `Avg Order: Rs. ${avgBillValue.toFixed(2)} (${totalItemsSold} items)`;
    
    // Update progress bars
    const profitBar = document.getElementById('profitProgress');
    if (profitBar) profitBar.style.width = `${Math.min(100, Math.max(0, marginPct))}%`;
    
    const costBar = document.getElementById('costProgress');
    if (costBar) {
        const costPct = totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;
        costBar.style.width = `${Math.min(100, Math.max(0, costPct))}%`;
    }
    
    // Product sales breakdown table
    let displayProducts = products.map(p => {
        const rangeSoldCount = productSoldMap[p.id] || 0;
        return { ...p, rangeSoldCount };
    }).filter(p => p.rangeSoldCount > 0);
    
    if (categoryFilter !== 'all') {
        displayProducts = displayProducts.filter(p => p.categoryId == categoryFilter);
    }
    
    const tableEl = document.getElementById('productSalesTable');
    if (!tableEl) return;
    
    if (displayProducts.length === 0) {
        tableEl.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No product sales recorded for this period</p>';
        return;
    }
    
    let tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Cost Price</th>
                    <th>Sale Price</th>
                    <th>Profit per Item</th>
                    <th>Quantity Sold</th>
                    <th>Total Revenue</th>
                    <th>Total Profit</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    displayProducts.forEach(product => {
        const category = categories.find(c => c.id === product.categoryId);
        const profitPerItem = product.salePrice - product.costPrice;
        const pRevenue = product.salePrice * product.rangeSoldCount;
        const pProfit = profitPerItem * product.rangeSoldCount;
        
        tableHTML += `
            <tr>
                <td><strong>${product.name}</strong></td>
                <td>${category ? category.name : 'Unknown'}</td>
                <td>Rs. ${product.costPrice.toFixed(2)}</td>
                <td>Rs. ${product.salePrice.toFixed(2)}</td>
                <td style="color: var(--primary-green); font-weight: 600;">Rs. ${profitPerItem.toFixed(2)}</td>
                <td><strong>${product.rangeSoldCount}</strong></td>
                <td>Rs. ${pRevenue.toFixed(2)}</td>
                <td style="color: var(--primary-green); font-weight: 600;">Rs. ${pProfit.toFixed(2)}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    tableEl.innerHTML = tableHTML;
}

// Product Management (Admin Only)
function renderProductManagement() {
    if (currentUser.role !== 'admin') return;
    
    // Ensure all category dropdowns (including #productCategory and #productManagementCategoryFilter) are populated!
    updateCategoryFilters();
    
    const categoryFilter = document.getElementById('productManagementCategoryFilter');
    if (categoryFilter) {
        const currentValue = categoryFilter.value;
        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            categoryFilter.appendChild(option);
        });
        if (currentValue) categoryFilter.value = currentValue;
    }
    
    // Render categories
    const categoriesList = document.getElementById('categoriesList');
    categoriesList.innerHTML = '';
    
    categories.forEach(category => {
        const div = document.createElement('div');
        div.className = 'item-row';
        div.innerHTML = `
            <div class="item-info">
                <div class="item-name">${category.name}</div>
            </div>
            <div class="item-actions">
                <button class="btn-secondary" onclick="renameCategory(${category.id})" style="padding: 6px 14px; font-size: 13px;">✏️ Rename</button>
                <button class="btn-delete" onclick="deleteCategory(${category.id})">Delete</button>
            </div>
        `;
        categoriesList.appendChild(div);
    });
    
    // Render products with filtering
    const productsList = document.getElementById('productsManagementList');
    productsList.innerHTML = '';
    
    const filterValue = categoryFilter ? categoryFilter.value : 'all';
    let filteredProducts = products;
    if (filterValue !== 'all') {
        filteredProducts = products.filter(p => p.categoryId == filterValue);
    }
    
    filteredProducts.forEach(product => {
        const category = categories.find(c => c.id === product.categoryId);
        const div = document.createElement('div');
        div.className = 'item-row';
        div.id = `product-${product.id}`;
        div.innerHTML = `
            <div class="item-info">
                <div class="item-name">${product.name}</div>
                <div class="item-details">
                    Category: ${category ? category.name : 'Unknown'} | 
                    Cost: Rs. <input type="number" step="0.01" value="${product.costPrice.toFixed(2)}" 
                           onchange="updateProductPrice(${product.id}, 'cost', this.value)" 
                           class="inline-edit-input" /> | 
                    Sale: Rs. <input type="number" step="0.01" value="${product.salePrice.toFixed(2)}" 
                           onchange="updateProductPrice(${product.id}, 'sale', this.value)" 
                           class="inline-edit-input" /> | 
                    Sold: ${product.soldCount || 0}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-secondary" onclick="renameProduct(${product.id})" style="padding: 6px 12px; font-size: 13px; margin-right: 5px;">✏️ Rename</button>
                <button class="btn-delete" onclick="deleteProduct(${product.id})">Delete</button>
            </div>
        `;
        productsList.appendChild(div);
    });
}

function addCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    if (!name) {
        showToast('Please enter a category name', 'warning');
        return;
    }
    
    categories.push({
        id: Date.now(),
        name: name
    });
    
    document.getElementById('newCategoryName').value = '';
    saveData();
    showToast('✓ Category added', 'success');
    updateCategoryFilters();
    renderProductManagement();
}

function renameCategory(categoryId) {
    const category = categories.find(c => c.id == categoryId);
    if (!category) return;
    
    const newName = prompt('Enter new name for category:', category.name);
    if (newName === null) return; // User cancelled
    
    const trimmedName = newName.trim();
    if (!trimmedName) {
        showToast('Category name cannot be empty', 'warning');
        return;
    }
    
    if (trimmedName === category.name) return; // No change
    
    const oldName = category.name;
    category.name = trimmedName;
    
    saveData();
    showToast(`✓ Category renamed to "${trimmedName}"`, 'success');
    
    // Refresh all UI components
    updateCategoryFilters();
    renderProducts();
    renderProductManagement();
    updateDashboard();
}

function deleteCategory(categoryId) {
    const cat = categories.find(c => c.id == categoryId);
    const categoryName = cat ? cat.name : 'Category';
    const productsInCategory = products.filter(p => p.categoryId == categoryId);
    
    let msg = `Are you sure you want to delete category "${categoryName}"?`;
    if (productsInCategory.length > 0) {
        msg = `Deleting "${categoryName}" will automatically delete all ${productsInCategory.length} product(s) in this category. Continue?`;
    }
    
    if (!confirm(msg)) {
        return;
    }
    
    // Automatically delete all products related to this category
    const deletedProductIds = productsInCategory.map(p => p.id);
    products = products.filter(p => p.categoryId != categoryId);
    
    // Clean up cart if any removed items were present
    if (deletedProductIds.length > 0) {
        cart = cart.filter(item => !deletedProductIds.includes(item.productId));
        updateCart();
    }
    
    // Delete category
    categories = categories.filter(c => c.id != categoryId);
    
    saveData();
    showToast(`✓ Category "${categoryName}" & related products deleted`, 'info');
    
    // Refresh all views
    updateCategoryFilters();
    renderProducts();
    renderProductManagement();
    updateDashboard();
}

function addProduct() {
    const categorySelect = document.getElementById('productCategory');
    const categoryIdVal = categorySelect ? categorySelect.value : '';
    const categoryId = parseInt(categoryIdVal);
    const nameInput = document.getElementById('productName');
    const name = nameInput ? nameInput.value.trim() : '';
    const costPrice = parseFloat(document.getElementById('productCost')?.value) || 0;
    const salePrice = parseFloat(document.getElementById('productSale')?.value) || 0;
    
    if (!categoryIdVal || isNaN(categoryId)) {
        showToast('Please select a Category first!', 'warning');
        return;
    }
    
    if (!name) {
        showToast('Please enter a Product Name!', 'warning');
        return;
    }
    
    const newProduct = {
        id: Date.now(),
        categoryId: categoryId,
        name: name,
        costPrice: costPrice,
        salePrice: salePrice,
        soldCount: 0
    };
    
    products.push(newProduct);
    
    if (categorySelect) categorySelect.value = '';
    if (nameInput) nameInput.value = '';
    const costInput = document.getElementById('productCost');
    if (costInput) costInput.value = '';
    const saleInput = document.getElementById('productSale');
    if (saleInput) saleInput.value = '';
    
    saveData();
    showToast(`✓ Product "${name}" added successfully!`, 'success');
    
    renderProductManagement();
    renderProducts();
    updateDashboard();
}

function updateProductPrice(productId, priceType, value) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const numValue = parseFloat(value) || 0;
    
    if (priceType === 'cost') {
        product.costPrice = numValue;
    } else if (priceType === 'sale') {
        product.salePrice = numValue;
    }
    
    // Save immediately
    saveData();
    
    // Force another save after a delay
    setTimeout(() => {
        saveData();
        console.log('Product price saved:', product.name, priceType, numValue);
    }, 100);
    
    // Visual feedback that data was saved
    const productRow = document.getElementById(`product-${productId}`);
    if (productRow) {
        productRow.style.backgroundColor = '#d4edda';
        setTimeout(() => {
            productRow.style.backgroundColor = '';
        }, 500);
    }
    
    renderProducts(); // Update billing page products
}

function renameProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newName = prompt('Enter new name for product:', product.name);
    if (newName === null) return; // User cancelled
    
    const trimmedName = newName.trim();
    if (!trimmedName) {
        showToast('Product name cannot be empty', 'warning');
        return;
    }
    
    if (trimmedName === product.name) return; // No change
    
    const oldName = product.name;
    product.name = trimmedName;
    
    saveData();
    showToast(`✓ Product renamed to "${trimmedName}"`, 'success');
    
    renderProductManagement();
    renderProducts();
    updateDashboard();
}

function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    products = products.filter(p => p.id !== productId);
    saveData();
    renderProductManagement();
    renderProducts();
}

function manualSave() {
    saveData(true);
}

function exportData() {
    const data = {
        products,
        categories,
        receipts,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ramz-e-takhleeq-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('✓ Data exported successfully!', 'success');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('This will replace all current data. Are you sure?')) {
                products = data.products || [];
                categories = data.categories || [];
                receipts = data.receipts || [];
                saveData(true);
                showToast('✓ Data imported successfully!', 'success');
                renderProductManagement();
                updateCategoryFilters();
            }
        } catch (error) {
            showToast('Error importing data: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Data Persistence (Offline-First Dual Storage)
function saveData(isUserInitiated = false) {
    const data = {
        products,
        categories,
        receipts,
        lastSaved: new Date().toISOString()
    };
    
    // 1. ALWAYS save to localStorage first (Guaranteed local fallback)
    try {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('billingSystem', JSON.stringify({ currentUser, ...data }));
        console.log('✓ Data saved locally at', data.lastSaved);
    } catch (error) {
        console.error('✗ localStorage save error:', error);
    }
    
    // 2. Sync to Firebase if enabled
    if (isFirebaseEnabled && database) {
        return database.ref('billingData').set(data)
            .then(() => {
                console.log('✓ Data synced to cloud at', data.lastSaved);
                updateSyncBadge('synced', '🟢 Cloud Synced', 'All changes saved to cloud database');
                if (isUserInitiated) {
                    showToast('✓ Data saved & synced to cloud', 'success');
                }
                return true;
            })
            .catch((error) => {
                console.error('✗ Firebase save error:', error);
                const isPermissionDenied = error && (error.code === 'PERMISSION_DENIED' || (error.message && error.message.includes('permission_denied')));
                const badgeTitle = isPermissionDenied 
                    ? 'Cloud permission denied (Firebase rules may be expired). Saved locally.' 
                    : 'Cloud sync offline. Data is safely saved locally.';
                
                updateSyncBadge('local', '🟡 Saved Locally', badgeTitle);
                
                if (isUserInitiated) {
                    showToast('⚠ Cloud sync offline — saved locally', 'warning');
                }
                return false;
            });
    } else {
        updateSyncBadge('local', '🟡 Local Mode', 'Running in local browser storage mode');
        if (isUserInitiated) {
            showToast('✓ Data saved locally', 'success');
        }
        return Promise.resolve(true);
    }
}

function loadData() {
    // Load currentUser from localStorage (login state is device-specific)
    try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            currentUser = JSON.parse(userData);
        }
    } catch (error) {
        console.error('localStorage currentUser load error:', error);
    }
    
    // Load data from Firebase primary storage, falling back to localStorage seamlessly
    if (isFirebaseEnabled && database) {
        return database.ref('billingData').once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    products = data.products || [];
                    categories = data.categories || [];
                    receipts = data.receipts || [];
                    console.log('✓ Data loaded from CLOUD - Products:', products.length, 'Categories:', categories.length, 'Receipts:', receipts.length);
                    updateSyncBadge('synced', '🟢 Cloud Synced', 'Connected to cloud database');
                    // Cache to local storage as well
                    try {
                        localStorage.setItem('billingSystem', JSON.stringify({ currentUser, ...data }));
                    } catch (e) {}
                } else {
                    console.log('⚠ No cloud data found, checking local storage');
                    loadFromLocalStorage();
                    updateSyncBadge('synced', '🟢 Cloud Synced', 'Connected (Database initialized)');
                }
                return true;
            })
            .catch((error) => {
                console.error('✗ Firebase load error:', error);
                loadFromLocalStorage();
                updateSyncBadge('local', '🟡 Local Mode', 'Cloud unavailable. Using local storage data.');
                showToast('⚠ Cloud database offline. Operating in Local Mode.', 'warning');
                return false;
            });
    } else {
        console.log('⚠ Firebase not enabled, using localStorage');
        loadFromLocalStorage();
        updateSyncBadge('local', '🟡 Local Mode', 'Firebase not configured.');
        return Promise.resolve(true);
    }
}

function loadFromLocalStorage() {
    try {
        const localData = localStorage.getItem('billingSystem');
        if (localData) {
            const parsed = JSON.parse(localData);
            currentUser = parsed.currentUser;
            products = parsed.products || [];
            categories = parsed.categories || [];
            receipts = parsed.receipts || [];
            console.log('✓ Data loaded from localStorage - Products:', products.length);
        }
    } catch (error) {
        console.error('localStorage load error:', error);
    }
}

function showFirebaseInstructions() {
    const instructions = `
FIREBASE CLOUD SYNC SETUP:

1. Go to: https://console.firebase.google.com/
2. Click "Add Project" (or use existing)
3. Enter project name: "Ramz-E-Takhleeq"
4. Disable Google Analytics (optional)
5. Click "Create Project"

6. In Firebase Console:
   - Click "Realtime Database" in left menu
   - Click "Create Database"
   - Choose location closest to you
   - Start in "Test Mode" (public access)
   - Click "Enable"

7. Get your config:
   - Click the gear icon (⚙) > Project settings
   - Scroll to "Your apps" section
   - Click "Web" button (</>) to add web app
   - Register app with nickname "Billing System"
   - Copy the firebaseConfig object

8. Open app.js file in your code
   - Find the firebaseConfig section at the top
   - Replace the placeholder values with your config
   - Save the file

9. Refresh the page - Cloud sync will be active!

Note: In Test Mode, anyone with the link can access data.
For production, set up Firebase Authentication.
    `;
    alert(instructions);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', init);

// Save data before page unload
window.addEventListener('beforeunload', function(e) {
    saveData();
});

// Auto-save every 5 seconds
setInterval(() => {
    if (products.length > 0 || categories.length > 0 || receipts.length > 0) {
        saveData();
    }
}, 5000);

// Handle Enter key in login form
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.querySelector('#loginScreen input[type="password"]');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
});
