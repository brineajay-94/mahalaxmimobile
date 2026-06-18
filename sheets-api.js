var SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbz_8maF1OZFTu8ES9m8xii816Y3XzDp7ofoxFjrH6Xgi3Z-Os_SjkLkA9OnA1bQaxt5_A/exec';
var CACHE_TTL = 120000;

function getToken() {
  return localStorage.getItem('adminToken');
}

function setToken(token) {
  if (token) localStorage.setItem('adminToken', token);
  else localStorage.removeItem('adminToken');
}

function getAdminEmail() {
  return localStorage.getItem('adminEmail');
}

function setAdminEmail(email) {
  if (email) localStorage.setItem('adminEmail', email);
  else localStorage.removeItem('adminEmail');
}

function getAdminRole() {
  return localStorage.getItem('adminRole') || '';
}

function setAdminRole(role) {
  if (role) localStorage.setItem('adminRole', role);
  else localStorage.removeItem('adminRole');
}

function getAdminName() {
  return localStorage.getItem('adminName') || '';
}

function setAdminName(name) {
  if (name) localStorage.setItem('adminName', name);
  else localStorage.removeItem('adminName');
}

function fetchTimeout(url, ms, opts) {
  return Promise.race([
    opts ? fetch(url, opts) : fetch(url),
    new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('Request timed out')); }, ms || 15000);
    })
  ]);
}

function sheets_getLocalCache(sheetName) {
  try {
    var raw = localStorage.getItem('cache_' + sheetName);
    if (!raw) return null;
    return JSON.parse(raw).data;
  } catch (e) {}
  return null;
}

function sheets_setLocalCache(sheetName, data) {
  try {
    localStorage.setItem('cache_' + sheetName, JSON.stringify({ ts: Date.now(), data: data }));
  } catch (e) {}
}

function sheets_clearLocalCache(sheetName) {
  if (sheetName) localStorage.removeItem('cache_' + sheetName);
  else ['products', 'repairs', 'users', 'activity', 'settings'].forEach(function (n) { localStorage.removeItem('cache_' + n); });
}

function sheets_getAll(sheetName) {
  var cached = sheets_getLocalCache(sheetName);
  if (cached) {
    fetchTimeout(SHEETS_API_URL + '?action=getAll&sheet=' + encodeURIComponent(sheetName) + '&_=' + Date.now())
      .then(function (r) { return r.json(); })
      .then(function (data) { sheets_setLocalCache(sheetName, data); })
      .catch(function () {});
    return Promise.resolve(cached);
  }
  return fetchTimeout(SHEETS_API_URL + '?action=getAll&sheet=' + encodeURIComponent(sheetName) + '&_=' + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (data) { sheets_setLocalCache(sheetName, data); return data; });
}

function sheets_getById(sheetName, id) {
  var cached = sheets_getLocalCache(sheetName);
  if (cached) {
    for (var i = 0; i < cached.length; i++) { if (cached[i].id === id) return Promise.resolve(cached[i]); }
  }
  return fetchTimeout(SHEETS_API_URL + '?action=getById&sheet=' + encodeURIComponent(sheetName) + '&id=' + encodeURIComponent(id))
    .then(function (r) { return r.json(); });
}

function sheets_getSetting(key) {
  var cached = sheets_getLocalCache('settings');
  if (cached) {
    for (var i = 0; i < cached.length; i++) { if (cached[i].key === key) return Promise.resolve(cached[i].value || ''); }
    return Promise.resolve('');
  }
  sheets_getAll('settings').catch(function () {});
  return fetchTimeout(SHEETS_API_URL + '?action=getSetting&key=' + encodeURIComponent(key))
    .then(function (r) { return r.text(); })
    .then(function (t) { return t ? JSON.parse(t) : ''; });
}

function sheets_save(sheetName, id, data) {
  sheets_clearLocalCache(sheetName);
  return fetchTimeout(SHEETS_API_URL, 20000, {
    method: 'POST',
    body: JSON.stringify({ action: 'save', sheet: sheetName, id: id, data: data, token: getToken() })
  }).then(function (r) { return r.json(); });
}

function sheets_delete(sheetName, id) {
  sheets_clearLocalCache(sheetName);
  return fetchTimeout(SHEETS_API_URL, 20000, {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', sheet: sheetName, id: id, token: getToken() })
  }).then(function (r) { return r.json(); });
}

function sheets_login(email, password) {
  return fetchTimeout(SHEETS_API_URL + '?action=auth&email=' + encodeURIComponent(email) + '&password=' + encodeURIComponent(password))
    .then(function (r) { return r.json(); })
    .then(function (res) {
      if (res.success) {
        setToken(res.token);
        setAdminEmail(res.email);
        setAdminRole(res.role);
        setAdminName(res.name);
      }
      return res;
    });
}

function sheets_verifyToken() {
  var token = getToken();
  if (!token) return Promise.resolve(false);
  return fetchTimeout(SHEETS_API_URL + '?action=verifyToken&token=' + encodeURIComponent(token))
    .then(function (r) { return r.json(); })
    .then(function (res) { return res; });
}

function sheets_logout() {
  setToken(null);
  setAdminEmail(null);
  setAdminRole(null);
  setAdminName(null);
  sheets_clearLocalCache();
}

var sheets_cache = {};

function sheets_getCached(sheetName) {
  return sheets_cache[sheetName] || [];
}

function sheets_setCache(sheetName, data) {
  sheets_cache[sheetName] = data;
}
