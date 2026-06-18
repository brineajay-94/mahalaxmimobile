var currentRole = null;

document.addEventListener('DOMContentLoaded', function () {
  loadTheme();
  var path = window.location.pathname;
  if (path.includes('login.html')) { checkAuthLogin(); return; }
  checkAuth().then(function () {
    if (path.includes('dashboard') || path.endsWith('index.html') || path.endsWith('/admin/')) { loadDashboard(); }
    if (path.includes('products')) { loadProducts(); }
    if (path.includes('repairs')) { loadRepairs(); }
    if (path.includes('users')) { loadUsers(); }
  });
});

function showToast(msg, type) {
  var c = document.getElementById('toastContainer');
  if (!c) return;
  var t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'info');
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(function () { t.remove(); }, 3000);
}

function toggleSidebar() {
  var s = document.getElementById('sidebar');
  var o = document.getElementById('sidebarOverlay');
  if (s) s.classList.toggle('open');
  if (o) o.classList.toggle('show');
}

function canManage(table) {
  if (currentRole === 'superadmin') return true;
  if (table === 'products' && (currentRole === 'admin' || currentRole === 'product')) return true;
  if (table === 'repairs' && (currentRole === 'admin' || currentRole === 'repair')) return true;
  if (table === 'users') return false;
  return false;
}

function checkAuthLogin() {
  sheets_verifyToken().then(function (r) {
    if (r && r.valid && r.role) { window.location.href = 'dashboard.html'; }
  });
}

function checkAuth() {
  var token = getToken();
  if (!token) { window.location.href = 'login.html'; return Promise.resolve(); }
  currentRole = getAdminRole() || 'admin';
  var allowed = { superadmin: 1, admin: 1, repair: 1, product: 1 };
  if (!allowed[currentRole]) { window.location.href = 'login.html'; return Promise.resolve(); }
  var a = document.getElementById('adminAvatar');
  var email = getAdminEmail();
  var name = getAdminName();
  if (a) {
    var n = (name || email || 'A')[0].toUpperCase();
    a.textContent = n;
  }
  return sheets_getAll('users').then(function (users) {
    if (!users || !users.length) return;
    var user = users.find(function (u) { return (u.email || '').toLowerCase() === (email || '').toLowerCase(); });
    if (user && user.role && allowed[user.role] && user.role !== currentRole) {
      currentRole = user.role;
      setAdminRole(user.role);
    }
    if (a && user) {
      var n = (user.name || user.email || 'A')[0].toUpperCase();
      a.textContent = n;
    }
  });
}

function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('email').value;
  var pass = document.getElementById('password').value;
  var btn = document.getElementById('loginBtn');
  var err = document.getElementById('loginError');
  btn.disabled = true; btn.textContent = 'Signing in...'; err.classList.remove('show');
  sheets_login(email, pass).then(function (r) {
    if (r.success && r.role) {
      setAdminRole(r.role); setAdminName(r.name);
      window.location.href = 'dashboard.html';
    } else {
      sheets_logout();
      err.textContent = r.error || 'Access denied'; err.classList.add('show');
      btn.disabled = false; btn.textContent = 'Sign in';
    }
  }).catch(function () { btn.disabled = false; btn.textContent = 'Sign in'; });
}

function handleLogout() { sheets_logout(); window.location.href = 'login.html'; }

function clearCache() {
  sheets_clearLocalCache();
  showToast('Cache cleared, refreshing...', 'info');
  setTimeout(function () { window.location.reload(); }, 300);
}

function toggleTheme() {
  var d = document.documentElement.classList.toggle('dark');
  localStorage.setItem('adminTheme', d ? 'dark' : 'light');
  updateIcon(d);
}
function loadTheme() {
  var d = (localStorage.getItem('adminTheme') || 'light') === 'dark';
  if (d) document.documentElement.classList.add('dark');
  updateIcon(d);
}
function updateIcon(isDark) {
  var i = document.getElementById('themeIcon');
  if (!i) return;
  i.innerHTML = isDark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
}

function logActivity(action, entity, name) {
  var now = new Date();
  var data = {
    action: action,
    entity: entity,
    name: name,
    admin: getAdminName() || getAdminEmail() || 'Unknown',
    time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    timestamp: now.getTime()
  };
  sheets_save('activity', null, data).catch(function () {});
}

function loadDashboard() {
  Promise.all([sheets_getAll('products'), sheets_getAll('repairs'), sheets_getAll('activity')]).then(function (r) {
    var p = r[0] || [], rp = r[1] || [], act = r[2] || [];
    var pending = rp.filter(function (x) { return x.status === 'Pending' || x.status === 'Diagnosing' || x.status === 'Under Repair'; }).length;
    var colors = { superadmin: '#ef4444', admin: '#f97316', repair: '#3b82f6', product: '#10b981' };
    document.getElementById('statsGrid').innerHTML =
      '<div class="stat-card"><div class="stat-card-title">Total Devices</div><div class="stat-card-value">' + p.length + '</div></div>' +
      '<div class="stat-card"><div class="stat-card-title">Total Repairs</div><div class="stat-card-value">' + rp.length + '</div></div>' +
      '<div class="stat-card"><div class="stat-card-title">Pending</div><div class="stat-card-value">' + pending + '</div></div>' +
      '<div class="stat-card"><div class="stat-card-title">Delivered</div><div class="stat-card-value">' + rp.filter(function (x) { return x.status === 'Delivered'; }).length + '</div></div>' +
      '<div class="stat-card" style="grid-column:1/-1;text-align:center;padding:12px;background:var(--surface-container)"><span style="font-size:14px;color:var(--text-secondary)">Signed in as </span><span style="font-weight:600;color:' + (colors[currentRole] || '#6b7280') + ';text-transform:capitalize">' + currentRole + '</span></div>';
    var recent = act.filter(function (a) { return a.timestamp; }).sort(function (a, b) { return (b.timestamp || 0) - (a.timestamp || 0); }).slice(0, 10);
    var el = document.getElementById('recentActivity');
    if (el) {
      el.innerHTML = '<div class="card"><div class="card-header"><span>Recent Activity</span></div><div class="table-wrap"><table><thead><tr><th>Action</th><th>Entity</th><th>Name</th><th>Admin</th><th>Date</th></tr></thead><tbody>' +
        (recent.length ? recent.map(function (a) {
          var ac = a.action === 'Deleted' ? '#ef4444' : a.action === 'Added' ? '#10b981' : '#3b82f6';
          return '<tr><td style="color:' + ac + ';font-weight:600">' + (a.action || '') + '</td><td>' + (a.entity || '') + '</td><td>' + (a.name || '') + '</td><td>' + (a.admin || '') + '</td><td>' + (a.date || '') + '</td></tr>';
        }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);padding:1rem">No activity yet</td></tr>') +
        '</tbody></table></div></div>';
    }
  });
}

// ===== PRODUCTS =====
var products = [];
function loadProducts() {
  sheets_getAll('products').then(function (d) { products = d || []; filterProducts(); });
  var addBtn = document.querySelector('#productsPage .btn-primary');
  if (addBtn) addBtn.style.display = canManage('products') ? '' : 'none';
}
function filterProducts() {
  var tbody = document.getElementById('tableBody');
  if (!tbody) return;
  var q = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase();
  var cat = document.getElementById('catFilter') ? document.getElementById('catFilter').value : 'all';
  var f = products.filter(function (p) {
    if (cat !== 'all' && p.category !== cat) return false;
    if (q && !(p.name || '').toLowerCase().includes(q) && !(p.brand || '').toLowerCase().includes(q)) return false;
    return true;
  });
  var manage = canManage('products');
  if (!f.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-secondary)">No devices found</td></tr>'; return; }
  tbody.innerHTML = f.map(function (p) {
    var badge = p.stock === 'Out of Stock' ? '#ef4444' : '#10b981';
    var rowId = p._id || p.id;
    var actions = manage
      ? '<div style="display:flex;gap:4px"><button class="btn btn-sm btn-secondary" onclick="editProduct(\'' + rowId + '\')">Edit</button><button class="btn btn-sm btn-danger" onclick="deleteProduct(\'' + rowId + '\')">Delete</button></div>'
      : '<span style="color:var(--text-secondary);font-size:13px">View only</span>';
    return '<tr>' +
      '<td><img class="table-img" src="' + (p.image || '') + '" alt="" onerror="this.style.display=\'none\'"></td>' +
      '<td style="font-weight:600">' + (p.name || '') + '</td>' +
      '<td>' + (p.brand || '') + '</td>' +
      '<td>' + (p.category || '') + '</td>' +
      '<td>\u20b9' + Number(p.price || 0).toLocaleString() + '</td>' +
      '<td><span style="color:' + badge + ';font-weight:500">' + (p.stock || '') + '</span></td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}

function openModal() {
  if (!canManage('products')) { showToast('You do not have permission', 'error'); return; }
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';
  document.getElementById('modalTitle').textContent = 'Add Device';
  document.getElementById('submitBtn').textContent = 'Save';
  document.getElementById('modalOverlay').classList.add('open');
}
function editProduct(rowId) {
  if (!canManage('products')) { showToast('You do not have permission', 'error'); return; }
  var p = products.find(function (x) { return (x._id || x.id) === rowId; });
  if (!p) return;
  document.getElementById('productId').value = p.id || '';
  document.getElementById('pName').value = p.name || '';
  document.getElementById('pBrand').value = p.brand || '';
  document.getElementById('pCategory').value = p.category || '';
  document.getElementById('pImage').value = p.image || '';
  document.getElementById('pPrice').value = p.price || '';
  document.getElementById('pOldPrice').value = p.oldPrice || '';
  document.getElementById('pStock').value = p.stock || 'In Stock';
  document.getElementById('pFeatured').value = p.featured || 'no';
  document.getElementById('pUrl').value = p.url || '';
  document.getElementById('pSpecs').value = p.specs || '';
  document.getElementById('modalTitle').textContent = 'Edit Device';
  document.getElementById('submitBtn').textContent = 'Update';
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }
function saveProduct(e) {
  e.preventDefault();
  if (!canManage('products')) { showToast('You do not have permission', 'error'); return; }
  var id = document.getElementById('productId').value;
  var data = {
    name: document.getElementById('pName').value,
    brand: document.getElementById('pBrand').value,
    category: document.getElementById('pCategory').value,
    image: document.getElementById('pImage').value,
    price: parseFloat(document.getElementById('pPrice').value) || 0,
    oldPrice: parseFloat(document.getElementById('pOldPrice').value) || 0,
    stock: document.getElementById('pStock').value,
    featured: document.getElementById('pFeatured').value,
    url: document.getElementById('pUrl').value || '',
    specs: document.getElementById('pSpecs').value || ''
  };
  var isNew = !id;
  closeModal();
  if (isNew) { data._id = 'tmp_' + Date.now(); products.push(data); filterProducts(); }
  else { var idx = products.findIndex(function (x) { return x.id === id; }); if (idx > -1) { products[idx] = data; filterProducts(); } }
  showToast(isNew ? 'Device added' : 'Device updated', 'success');
  sheets_save('products', id || null, data).then(function (res) {
    if (isNew && res && res.id) { var fi = products.findIndex(function (x) { return x._id === data._id; }); if (fi > -1) { products[fi].id = res.id; delete products[fi]._id; } }
    logActivity(isNew ? 'Added' : 'Updated', 'Product', data.name);
  }).catch(function (err) { showToast('Saved locally but sync error: ' + (err.message || 'Error'), 'error'); loadProducts(); });
}
function deleteProduct(rowId) {
  if (!canManage('products')) { showToast('You do not have permission', 'error'); return; }
  var realId = rowId.indexOf('tmp_') === 0 ? null : rowId;
  var idx = products.findIndex(function (x) { return (x._id || x.id) === rowId; });
  var item = idx > -1 ? products[idx] : null;
  if (idx > -1) products.splice(idx, 1);
  filterProducts();
  showToast('Device deleted', 'success');
  if (realId) sheets_delete('products', realId).then(function () {
    logActivity('Deleted', 'Product', item ? item.name : 'Unknown');
  }).catch(function (err) { showToast('Delete sync error: ' + (err.message || 'Error'), 'error'); if (item) { products.push(item); filterProducts(); } });
}

// ===== REPAIRS =====
var repairs = [];
function loadRepairs() {
  sheets_getAll('repairs').then(function (d) { repairs = d || []; filterRepairs(); });
  var addBtn = document.querySelector('#repairsPage .btn-primary');
  if (addBtn) addBtn.style.display = canManage('repairs') ? '' : 'none';
}
function filterRepairs() {
  var tbody = document.getElementById('repairsTableBody');
  if (!tbody) return;
  var q = (document.getElementById('searchInput') ? document.getElementById('searchInput').value : '').toLowerCase();
  var f = (repairs || []).filter(function (r) {
    if (q && !(r.phone || '').includes(q) && !(r.customer || '').toLowerCase().includes(q)) return false;
    return true;
  }).reverse();
  var manage = canManage('repairs');
  if (!f.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-secondary)">No repairs found</td></tr>'; return; }
  tbody.innerHTML = f.map(function (r) {
    var colors = { Pending: '#eab308', Diagnosing: '#f97316', 'Under Repair': '#3b82f6', Repaired: '#10b981', Delivered: '#22c55e' };
    var rowId = r._id || r.id;
    var actions = manage
      ? '<div style="display:flex;gap:4px"><button class="btn btn-sm btn-secondary" onclick="editRepair(\'' + rowId + '\')">Edit</button><button class="btn btn-sm btn-danger" onclick="deleteRepair(\'' + rowId + '\')">Delete</button></div>'
      : '<span style="color:var(--text-secondary);font-size:13px">View only</span>';
    return '<tr>' +
      '<td style="font-weight:600">' + (r.phone || '') + '</td>' +
      '<td>' + (r.customer || '') + '</td>' +
      '<td>' + (r.device || '') + '</td>' +
      '<td>' + (r.issue || '') + '</td>' +
      '<td>\u20b9' + Number(r.cost || 0).toLocaleString() + '</td>' +
      '<td><span style="color:' + (colors[r.status] || '#6b7280') + ';font-weight:500">' + (r.status || 'Pending') + '</span></td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}
function openRepairModal() {
  if (!canManage('repairs')) { showToast('You do not have permission', 'error'); return; }
  document.getElementById('repairForm').reset();
  document.getElementById('repairId').value = '';
  document.getElementById('repairModalTitle').textContent = 'Add Repair';
  document.getElementById('repairSubmitBtn').textContent = 'Save';
  document.getElementById('repairModalOverlay').classList.add('open');
}
function closeRepairModal() { document.getElementById('repairModalOverlay').classList.remove('open'); }
function editRepair(rowId) {
  if (!canManage('repairs')) { showToast('You do not have permission', 'error'); return; }
  var r = repairs.find(function (x) { return (x._id || x.id) === rowId; });
  if (!r) return;
  document.getElementById('repairId').value = r.id || '';
  document.getElementById('rPhone').value = r.phone || '';
  document.getElementById('rCustomer').value = r.customer || '';
  document.getElementById('rDevice').value = r.device || '';
  document.getElementById('rCost').value = r.cost || '';
  document.getElementById('rIssue').value = r.issue || '';
  document.getElementById('rStatus').value = r.status || 'Pending';
  document.getElementById('repairModalTitle').textContent = 'Edit Repair';
  document.getElementById('repairSubmitBtn').textContent = 'Update';
  document.getElementById('repairModalOverlay').classList.add('open');
}
function saveRepair(e) {
  e.preventDefault();
  if (!canManage('repairs')) { showToast('You do not have permission', 'error'); return; }
  var id = document.getElementById('repairId').value;
  var data = {
    phone: document.getElementById('rPhone').value,
    customer: document.getElementById('rCustomer').value,
    device: document.getElementById('rDevice').value,
    cost: parseFloat(document.getElementById('rCost').value) || 0,
    issue: document.getElementById('rIssue').value,
    status: document.getElementById('rStatus').value,
    lastUpdated: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  };
  var rIsNew = !id;
  closeRepairModal();
  if (rIsNew) { data._id = 'tmp_' + Date.now(); repairs.push(data); filterRepairs(); }
  else { var idx = repairs.findIndex(function (x) { return x.id === id; }); if (idx > -1) { repairs[idx] = data; filterRepairs(); } }
  showToast(rIsNew ? 'Repair added' : 'Repair updated', 'success');
  sheets_save('repairs', id || null, data).then(function (res) {
    if (rIsNew && res && res.id) { var fi = repairs.findIndex(function (x) { return x._id === data._id; }); if (fi > -1) { repairs[fi].id = res.id; delete repairs[fi]._id; } }
    logActivity(rIsNew ? 'Added' : 'Updated', 'Repair', data.customer || data.phone);
  }).catch(function (err) { showToast('Saved locally but sync error: ' + (err.message || 'Error'), 'error'); loadRepairs(); });
}
function deleteRepair(rowId) {
  if (!canManage('repairs')) { showToast('You do not have permission', 'error'); return; }
  var realId = rowId.indexOf('tmp_') === 0 ? null : rowId;
  var idx = repairs.findIndex(function (x) { return (x._id || x.id) === rowId; });
  var r = idx > -1 ? repairs[idx] : null;
  if (idx > -1) repairs.splice(idx, 1);
  filterRepairs();
  showToast('Repair deleted', 'success');
  if (realId) sheets_delete('repairs', realId).then(function () {
    logActivity('Deleted', 'Repair', r ? (r.customer || r.phone) : 'Unknown');
  }).catch(function (err) { showToast('Delete sync error: ' + (err.message || 'Error'), 'error'); if (r) { repairs.push(r); filterRepairs(); } });
}

// ===== USERS =====
var users = [];
function loadUsers() {
  sheets_getAll('users').then(function (d) { users = d || []; renderUsers(); });
  var addBtn = document.querySelector('#usersPage .btn-primary');
  if (addBtn) addBtn.style.display = canManage('users') ? '' : 'none';
}
function renderUsers() {
  var tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  var order = { superadmin: 0, admin: 1, repair: 2, product: 3 };
  var sorted = users.slice().sort(function (a, b) { return (order[a.role] || 9) - (order[b.role] || 9); });
  var manage = canManage('users');
  if (!sorted.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--text-secondary)">No users found</td></tr>'; return; }
  tbody.innerHTML = sorted.map(function (u) {
    var colors = { superadmin: '#ef4444', admin: '#f97316', repair: '#3b82f6', product: '#10b981' };
    var rowId = u._id || u.id;
    var actions = manage
      ? '<div style="display:flex;gap:4px"><button class="btn btn-sm btn-secondary" onclick="editUser(\'' + rowId + '\')">Edit</button><button class="btn btn-sm btn-danger" onclick="deleteUser(\'' + rowId + '\')">Delete</button></div>'
      : '<span style="color:var(--text-secondary);font-size:13px">View only</span>';
    return '<tr>' +
      '<td>' + (u.email || '') + '</td>' +
      '<td>' + (u.name || '') + '</td>' +
      '<td><span style="color:' + (colors[u.role] || '#6b7280') + ';font-weight:600;text-transform:capitalize">' + (u.role || '') + '</span></td>' +
      '<td>' + (u.phone || '') + '</td>' +
      '<td>' + actions + '</td>' +
      '</tr>';
  }).join('');
}
function openUserModal() {
  if (!canManage('users')) { showToast('You do not have permission', 'error'); return; }
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('uPassword').required = true;
  document.getElementById('uPassword').style.display = '';
  document.getElementById('userModalTitle').textContent = 'Add User';
  document.getElementById('userSubmitBtn').textContent = 'Save';
  var roleSelect = document.getElementById('uRole');
  var superOpt = roleSelect.querySelector('option[value="superadmin"]');
  if (currentRole !== 'superadmin') { superOpt.disabled = true; superOpt.hidden = true; }
  else { superOpt.disabled = false; superOpt.hidden = false; }
  document.getElementById('userModalOverlay').classList.add('open');
}
function editUser(rowId) {
  if (!canManage('users')) { showToast('You do not have permission', 'error'); return; }
  var u = users.find(function (x) { return (x._id || x.id) === rowId; });
  if (!u) return;
  document.getElementById('userId').value = u.id || '';
  document.getElementById('uEmail').value = u.email || '';
  document.getElementById('uPassword').value = '';
  document.getElementById('uPassword').required = false;
  document.getElementById('uPassword').style.display = 'none';
  document.getElementById('uName').value = u.name || '';
  document.getElementById('uRole').value = u.role || 'admin';
  document.getElementById('uPhone').value = u.phone || '';
  document.getElementById('userModalTitle').textContent = 'Edit User';
  document.getElementById('userSubmitBtn').textContent = 'Update';
  var roleSelect = document.getElementById('uRole');
  var superOpt = roleSelect.querySelector('option[value="superadmin"]');
  if (currentRole !== 'superadmin') { superOpt.disabled = true; superOpt.hidden = true; }
  else { superOpt.disabled = false; superOpt.hidden = false; }
  document.getElementById('userModalOverlay').classList.add('open');
}
function closeUserModal() { document.getElementById('userModalOverlay').classList.remove('open'); }
function saveUser(e) {
  e.preventDefault();
  if (!canManage('users')) { showToast('You do not have permission', 'error'); return; }
  var id = document.getElementById('userId').value;
  var role = document.getElementById('uRole').value;
  if (role === 'superadmin' && currentRole !== 'superadmin') {
    showToast('Only superadmin can assign superadmin role', 'error');
    return;
  }
  var data = {
    email: document.getElementById('uEmail').value,
    name: document.getElementById('uName').value,
    role: role,
    phone: document.getElementById('uPhone').value
  };
  var pass = document.getElementById('uPassword').value;
  if (pass) data.password = pass;
  var uIsNew = !id;
  closeUserModal();
  if (uIsNew) { data._id = 'tmp_' + Date.now(); users.push(data); renderUsers(); }
  else { var idx = users.findIndex(function (x) { return x.id === id; }); if (idx > -1) { users[idx] = data; renderUsers(); } }
  showToast(uIsNew ? 'User added' : 'User updated', 'success');
  sheets_save('users', id || null, data).then(function (res) {
    if (uIsNew && res && res.id) { var fi = users.findIndex(function (x) { return x._id === data._id; }); if (fi > -1) { users[fi].id = res.id; delete users[fi]._id; } }
    logActivity(uIsNew ? 'Added' : 'Updated', 'User', data.email);
  }).catch(function (err) { showToast('Saved locally but sync error: ' + (err.message || 'Error'), 'error'); loadUsers(); });
}
function deleteUser(rowId) {
  if (!canManage('users')) { showToast('You do not have permission', 'error'); return; }
  var realId = rowId.indexOf('tmp_') === 0 ? null : rowId;
  var idx = users.findIndex(function (x) { return (x._id || x.id) === rowId; });
  var u = idx > -1 ? users[idx] : null;
  if (idx > -1) users.splice(idx, 1);
  renderUsers();
  showToast('User deleted', 'success');
  if (realId) sheets_delete('users', realId).then(function () {
    logActivity('Deleted', 'User', u ? u.email : 'Unknown');
  }).catch(function (err) { showToast('Delete sync error: ' + (err.message || 'Error'), 'error'); if (u) { users.push(u); renderUsers(); } });
}
