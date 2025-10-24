const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = path.join(__dirname, 'db.json');
const SECRET = 'change_this_secret_for_production';

app.use(cors());
app.use(express.json());

// --- simple DB helpers ---
function readDB(){
  const raw = fs.readFileSync(DB_PATH);
  return JSON.parse(raw);
}
function writeDB(db){
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// --- auth middleware ---
function authMiddleware(req, res, next){
  const auth = req.headers.authorization;
  if(!auth) return res.status(401).json({ message: 'No token provided' });
  const parts = auth.split(' ');
  if(parts.length !== 2) return res.status(401).json({ message: 'Token error' });
  const token = parts[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch(err){
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// --- routes ---
app.get('/api/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

app.get('/api/products/:id', (req, res) => {
  const db = readDB();
  const p = db.products.find(x => x.id === req.params.id);
  if(!p) return res.status(404).json({ message: 'Product not found' });
  res.json(p);
});

// register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if(!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  const db = readDB();
  const exists = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if(exists) return res.status(400).json({ message: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const newUser = {
    id: 'u' + Date.now(),
    name,
    email,
    passwordHash: hash,
    phone: phone || ''
  };
  db.users.push(newUser);
  writeDB(db);
  const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email }, SECRET, { expiresIn: '6h' });
  res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone } });
});

// login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if(!email || !password) return res.status(400).json({ message: 'Missing fields' });
  const db = readDB();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if(!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if(!ok) return res.status(400).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, SECRET, { expiresIn: '6h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
});

// create order
app.post('/api/orders', authMiddleware, (req, res) => {
  const { items, address } = req.body;
  if(!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Cart empty' });
  const db = readDB();
  // calculate total
  let total = 0;
  const detailedItems = items.map(it => {
    const prod = db.products.find(p => p.id === it.productId);
    if(!prod) return null;
    const qty = Number(it.quantity) || 1;
    const sub = prod.price * qty;
    total += sub;
    return {
      productId: prod.id,
      title: prod.title,
      price: prod.price,
      quantity: qty,
      subtotal: sub
    };
  }).filter(x => x !== null);
  const order = {
    id: 'o' + Date.now(),
    userId: req.user.id,
    items: detailedItems,
    total,
    address: address || '',
    createdAt: new Date().toISOString(),
    status: 'Pendiente'
  };
  db.orders.push(order);
  writeDB(db);
  res.json({ message: 'Order created', order });
});

// get orders for logged user
app.get('/api/orders', authMiddleware, (req, res) => {
  const db = readDB();
  const userOrders = db.orders.filter(o => o.userId === req.user.id);
  res.json(userOrders);
});

// contact
app.post('/api/contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  if(!name || !email || !message) return res.status(400).json({ message: 'Missing fields' });
  const db = readDB();
  const entry = {
    id: 'c' + Date.now(),
    name, email, phone: phone || '', message,
    createdAt: new Date().toISOString()
  };
  db.contacts.push(entry);
  writeDB(db);
  res.json({ message: 'Message received' });
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
