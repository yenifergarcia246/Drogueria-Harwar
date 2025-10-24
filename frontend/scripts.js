// Common frontend JS for Drogueria RG demo
const API_BASE = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
  setupAuthUI();
  if(document.getElementById('productsContainer')) {
    loadProducts();
    document.getElementById('searchInput').addEventListener('input', onSearch);
    document.getElementById('showAllBtn').addEventListener('click', loadProducts);
  }
  if(document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', onLogin);
  }
  if(document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', onRegister);
  }
  if(document.getElementById('contactForm')) {
    document.getElementById('contactForm').addEventListener('submit', onContact);
  }
  if(document.getElementById('placeOrderBtn')) {
    renderCart();
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
    if(document.getElementById('showMoreOrders')) {
      document.getElementById('showMoreOrders').addEventListener('click', loadOrders.bind(null, true));
    }
    loadOrders(false);
  }
});

// ----- Auth helpers -----
function getToken(){
  return localStorage.getItem('token') || null;
}
function getUser(){
  const u = localStorage.getItem('user');
  return u ? JSON.parse(u) : null;
}
function setAuth(token, user){
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  setupAuthUI();
}
function logout(){
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  setupAuthUI();
  window.location.href = 'index.html';
}

function setupAuthUI(){
  const user = getUser();
  const authDiv = document.getElementById('authButtons');
  const authDiv2 = document.getElementById('authButtonsOrders');
  if(authDiv) {
    if(user){
      authDiv.innerHTML = `<div class="d-flex align-items-center gap-2">
        <span class="small text-muted">Hola, ${escapeHtml(user.name)}</span>
        <a class="btn btn-outline-secondary" href="orders.html">Mis Pedidos</a>
        <button class="btn btn-danger" id="logoutBtn">Cerrar Sesión</button>
      </div>`;
      document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
      authDiv.innerHTML = `<a class="btn btn-outline-primary" href="login.html">Iniciar Sesión</a>
      <a class="btn btn-primary" href="register.html">Registrarse</a>`;
    }
  }
  if(authDiv2) {
    if(user){
      authDiv2.innerHTML = `<div class="small">Hola, ${escapeHtml(user.name)} <button class="btn btn-sm btn-danger" id="logoutBtn2">Cerrar Sesión</button></div>`;
      document.getElementById('logoutBtn2').addEventListener('click', logout);
    } else {
      authDiv2.innerHTML = `<a class="btn btn-primary" href="login.html">Iniciar Sesión</a>`;
    }
  }
}

// ----- Products -----
let ALL_PRODUCTS = [];
async function loadProducts(){
  try {
    const res = await fetch(API_BASE + '/products');
    ALL_PRODUCTS = await res.json();
    renderProducts(ALL_PRODUCTS);
  } catch(err){
    console.error(err);
    document.getElementById('productsContainer').innerHTML = '<p class="text-danger">Error cargando productos. Asegúrate de que el backend esté corriendo en http://localhost:5000</p>';
  }
}

function renderProducts(list){
  const container = document.getElementById('productsContainer');
  container.innerHTML = '';
  list.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <img src="${p.image}" class="card-img-top" alt="${escapeHtml(p.title)}">
        <div class="card-body d-flex flex-column">
          <h6 class="card-title">${escapeHtml(p.title)} ${p.prescription ? '<span class="badge bg-danger">Receta</span>' : ''}</h6>
          <p class="card-text small text-muted">${escapeHtml(p.description)}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <div><strong>$${Number(p.price).toFixed(2)}</strong></div>
            <button class="btn btn-primary btn-sm" onclick="addToCart('${p.id}')">Agregar</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

// ----- Search -----
function onSearch(e){
  const q = e.target.value.trim().toLowerCase();
  const filtered = ALL_PRODUCTS.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  renderProducts(filtered);
}

// ----- Cart -----
function getCart(){
  const raw = localStorage.getItem('cart');
  return raw ? JSON.parse(raw) : [];
}
function saveCart(c){
  localStorage.setItem('cart', JSON.stringify(c));
  renderCart();
}
function addToCart(productId){
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);
  if(item) item.quantity++;
  else cart.push({ productId, quantity: 1 });
  saveCart(cart);
  alert('Producto agregado al carrito');
}
function renderCart(){
  const container = document.getElementById('cartItems');
  if(!container) return;
  const cart = getCart();
  if(cart.length === 0) {
    container.innerHTML = '<p class="small text-muted">Tu carrito está vacío</p>';
    return;
  }
  // show line items with data from ALL_PRODUCTS (if available)
  let html = '<ul class="list-group">';
  let total = 0;
  cart.forEach(it => {
    const p = ALL_PRODUCTS.find(x => x.id === it.productId) || {};
    const title = p.title || it.productId;
    const price = p.price ? Number(p.price) : 0;
    const subtotal = price * it.quantity;
    total += subtotal;
    html += `<li class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <div class="fw-bold">${escapeHtml(title)}</div>
        <div class="small text-muted">${it.quantity} x $${price.toFixed(2)}</div>
      </div>
      <div>$${subtotal.toFixed(2)}</div>
    </li>`;
  });
  html += `</ul><div class="mt-3 text-end"><strong>Total: $${total.toFixed(2)}</strong></div>`;
  container.innerHTML = html;
}

// ----- Orders -----
async function placeOrder(){
  const token = getToken();
  const user = getUser();
  if(!token || !user) {
    if(confirm('Necesitas iniciar sesión para registrar el pedido. Ir a iniciar sesión?')) window.location.href = 'login.html';
    return;
  }
  const cart = getCart();
  if(cart.length === 0) { alert('El carrito está vacío'); return; }
  try {
    const res = await fetch(API_BASE + '/orders', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ items: cart, address: '' })
    });
    if(!res.ok) {
      const err = await res.json();
      document.getElementById('orderMsg').innerText = err.message || 'Error creando pedido';
      return;
    }
    const data = await res.json();
    localStorage.removeItem('cart');
    renderCart();
    document.getElementById('orderMsg').innerHTML = '<span class="text-success">Pedido registrado correctamente. ID: '+escapeHtml(data.order.id)+'</span>';
    loadOrders(false);
  } catch(err){
    console.error(err);
    document.getElementById('orderMsg').innerText = 'Error al conectar con el servidor';
  }
}

async function loadOrders(showAll){
  const token = getToken();
  const list = document.getElementById('ordersList');
  if(!token) {
    list.innerHTML = '<p class="small text-muted">Inicia sesión para ver tus pedidos.</p>';
    return;
  }
  try {
    const res = await fetch(API_BASE + '/orders', { headers: { 'Authorization': 'Bearer ' + token }});
    if(!res.ok) {
      list.innerHTML = '<p class="small text-danger">Error cargando pedidos.</p>';
      return;
    }
    const orders = await res.json();
    if(orders.length === 0) {
      list.innerHTML = '<p class="small text-muted">Aún no tienes pedidos.</p>';
      return;
    }
    // show first 3 unless showAll
    const toShow = showAll ? orders : orders.slice(0,3);
    let html = '';
    toShow.forEach(o => {
      html += `<div class="card mb-2 p-2">
        <div class="d-flex justify-content-between">
          <div><strong>ID:</strong> ${escapeHtml(o.id)}<br><small class="text-muted">${new Date(o.createdAt).toLocaleString()}</small></div>
          <div><strong>Total:</strong> $${Number(o.total).toFixed(2)}<br><span class="badge bg-secondary">${escapeHtml(o.status)}</span></div>
        </div>
        <div class="mt-2 small">${o.items.map(it => escapeHtml(it.title) + ' x' + it.quantity).join(', ')}</div>
      </div>`;
    });
    list.innerHTML = html;
  } catch(err){
    console.error(err);
    list.innerHTML = '<p class="small text-danger">Error al cargar pedidos</p>';
  }
}

// ----- Contact -----
async function onContact(e){
  e.preventDefault();
  const name = document.getElementById('contactName').value.trim();
  const email = document.getElementById('contactEmail').value.trim();
  const phone = document.getElementById('contactPhone').value.trim();
  const message = document.getElementById('contactMessage').value.trim();
  try {
    const res = await fetch(API_BASE + '/contact', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, phone, message })
    });
    const data = await res.json();
    if(!res.ok) {
      document.getElementById('contactMsg').innerText = data.message || 'Error';
      return;
    }
    document.getElementById('contactMsg').innerHTML = '<span class="text-success">Mensaje enviado. Gracias.</span>';
    document.getElementById('contactForm').reset();
  } catch(err){
    console.error(err);
    document.getElementById('contactMsg').innerText = 'Error al enviar mensaje';
  }
}

// ----- Auth forms -----
async function onRegister(e){
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  try {
    const res = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, phone, password })
    });
    const data = await res.json();
    if(!res.ok) {
      document.getElementById('regMsg').innerText = data.message || 'Error';
      return;
    }
    setAuth(data.token, data.user);
    window.location.href = 'index.html';
  } catch(err){
    console.error(err);
    document.getElementById('regMsg').innerText = 'Error al registrar';
  }
}

async function onLogin(e){
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  try {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if(!res.ok) {
      document.getElementById('loginMsg').innerText = data.message || 'Credenciales inválidas';
      return;
    }
    setAuth(data.token, data.user);
    window.location.href = 'index.html';
  } catch(err){
    console.error(err);
    document.getElementById('loginMsg').innerText = 'Error al iniciar sesión';
  }
}

// ----- Utils -----
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]); }); }
