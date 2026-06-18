var allProducts = [];
var allBrands = [];
var currentCategory = 'Mobile Phones';
var selectedBrand = null;
var sliderInterval;
var currentSlide = 0;
var totalSlides = 0;

var staticBanners = [
  { image: 'assets/slider0.png', title: 'Latest Smartphones at Best Prices' },
  { image: 'assets/slider1.png', title: 'Refurbished Phones with Warranty' },
  { image: 'assets/slider2.jpg', title: 'Professional Phone Repair Services' }
];

var staticBrands = ['All', 'Samsung', 'Apple', 'Xiaomi', 'Vivo', 'Oppo', 'OnePlus', 'Realme', 'Nokia', 'Nothing'];

var staticPromotions = [
  { image: '', title: 'Summer Sale', description: 'Up to 30% off on select smartphones. Limited time offer at Mahalaxmi Mobile Center.' },
  { image: '', title: 'Exchange Offer', description: 'Trade in your old phone and get up to \u20b95,000 off on new models.' },
  { image: '', title: 'Repair Discount', description: 'Flat 15% off on all screen replacements this month.' }
];

document.addEventListener('DOMContentLoaded', function () {
  loadTheme();
  loadAccentColor();
  var path = window.location.pathname;
  loadBanners();
  loadBrands();
  loadProducts();
  loadPromotions();
  loadTrending();
  if (path.includes('repairs')) { loadAllRepairs(); }
  setupCarouselDrag();
});

function toggleTheme() {
  var isDark = document.documentElement.classList.toggle('dark');
  updateThemeIconContent(isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  var cb = document.getElementById('themeToggle');
  if (cb) cb.checked = isDark;
}

function loadTheme() {
  var saved = localStorage.getItem('theme') || 'light';
  var isDark = saved === 'dark';
  if (isDark) document.documentElement.classList.add('dark');
  var cb = document.getElementById('themeToggle');
  if (cb) cb.checked = isDark;
  updateThemeIconContent(isDark);
}

function updateThemeIconContent(isDark) {
  var icon = document.getElementById('themeIcon');
  if (!icon) return;
  icon.innerHTML = isDark
    ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
    : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
}

function setAccentColor(color) {
  document.documentElement.style.setProperty('--primary', color);
  document.documentElement.style.setProperty('--primary-light', color + '33');
  document.documentElement.style.setProperty('--primary-dark', color + '99');
  document.documentElement.style.setProperty('--primary-bg', color + '14');
  localStorage.setItem('accentColor', color);
  document.querySelectorAll('.color-opt').forEach(function (el) { el.classList.toggle('active', el.dataset.color === color); });
}

function loadAccentColor() {
  var color = localStorage.getItem('accentColor');
  if (color) setAccentColor(color);
}

function toggleMobileMenu() {
  document.getElementById('mainNav').classList.toggle('open');
}

document.addEventListener('click', function (e) {
  var nav = document.getElementById('mainNav');
  var btn = document.querySelector('.mobile-menu-btn');
  if (nav && nav.classList.contains('open') && !nav.contains(e.target) && !(btn && btn.contains(e.target))) {
    nav.classList.remove('open');
  }
});

function showToast(message, type) {
  if (type === undefined) type = 'info';
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () { toast.remove(); }, 3500);
}

function loadBanners() {
  var slider = document.getElementById('heroSlider');
  if (!slider) return;
  var sorted = staticBanners;
  var html = '';
  sorted.forEach(function (b, i) {
    html += '<div class="hero-slide' + (i === 0 ? ' active' : '') + '">';
    html += '<div class="hero-slide-bg" style="background-image: url(\'' + b.image + '\')"></div>';
    html += '<div class="hero-label">' + (b.title || '') + '</div>';
    html += '</div>';
  });
  var dots = sorted.map(function (_, i) { return '<button class="hero-dot' + (i === 0 ? ' active' : '') + '" onclick="goToSlide(' + i + ')"></button>'; }).join('');
  html += '<div class="hero-dots">' + dots + '</div>';
  html += '<div class="hero-arrows"><button class="hero-arrow" onclick="prevSlide()">&#8249;</button><button class="hero-arrow" onclick="nextSlide()">&#8250;</button></div>';
  slider.innerHTML = html;
  startSlider(sorted.length);
}

function startSlider(count) {
  totalSlides = count;
  clearInterval(sliderInterval);
  sliderInterval = setInterval(nextSlide, 5000);
}

function goToSlide(index) {
  currentSlide = index;
  updateSlider();
}

function nextSlide() {
  if (totalSlides === 0) return;
  currentSlide = (currentSlide + 1) % totalSlides;
  updateSlider();
}

function prevSlide() {
  if (totalSlides === 0) return;
  currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
  updateSlider();
}

function updateSlider() {
  var slides = document.querySelectorAll('.hero-slide');
  var dots = document.querySelectorAll('.hero-dot');
  slides.forEach(function (s, i) { s.classList.toggle('active', i === currentSlide); });
  dots.forEach(function (d, i) { d.classList.toggle('active', i === currentSlide); });
}

function loadTrending() {
  var track = document.getElementById('trendingTrack');
  if (!track) return;
  var data = sheets_getCached('products');
  if (!data || data.length === 0) { return; }
  var products = data.filter(function (p) { return p.featured === 'yes'; });
  if (products.length === 0) { return; }
  track.innerHTML = products.map(function (p) {
    var discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return '\
      <div class="carousel-card">\
        <div class="carousel-card-img-wrap">\
          <img class="carousel-card-img" src="' + (p.image || '') + '" alt="' + p.name + '" loading="lazy" onerror="this.parentElement.style.background=\'var(--surface-container-high)\'">\
        </div>\
        <div class="carousel-card-body">\
          <div class="carousel-card-brand">' + (p.brand || '') + '</div>\
          <div class="carousel-card-name">' + (p.name || '') + '</div>\
          <div class="carousel-card-price">\
            <span class="carousel-card-current">\u20b9' + Number(p.price).toLocaleString() + '</span>\
            ' + (p.oldPrice ? '<span class="carousel-card-old">\u20b9' + Number(p.oldPrice).toLocaleString() + '</span>' : '') + '\
            ' + (discount > 0 ? '<span class="carousel-card-discount">-' + discount + '%</span>' : '') + '\
          </div>\
        </div>\
      </div>';
  }).join('');
}

function setupCarouselDrag() {
  var track = document.getElementById('trendingTrack');
  if (!track) return;
  var isDown = false, startX, scrollLeft;
  track.addEventListener('mousedown', function (e) { isDown = true; track.classList.add('active'); startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft; });
  track.addEventListener('mouseleave', function () { isDown = false; });
  track.addEventListener('mouseup', function () { isDown = false; });
  track.addEventListener('mousemove', function (e) { if (!isDown) return; e.preventDefault(); track.scrollLeft = scrollLeft - (e.pageX - track.offsetLeft - startX) * 0.8; });
}

function loadBrands() {
  var container = document.getElementById('brandFilters');
  if (!container) return;
  container.innerHTML = staticBrands.map(function (b) { return '<button class="brand-pill' + (b === 'All' ? ' active' : '') + '" onclick="filterByBrand(\'' + b.replace(/'/g, "\\'") + '\')">' + b + '</button>'; }).join('');
}

function filterByBrand(brand) {
  selectedBrand = brand === 'All' ? null : brand;
  document.querySelectorAll('.brand-pill').forEach(function (el) { el.classList.toggle('active', el.textContent === brand); });
  renderProducts();
}

function loadCategoryTabs() {
  var container = document.getElementById('categoryTabs');
  if (!container) return;
  var categories = ['Mobile Phones', 'Refurbished Phones', 'Second Hand Phones', 'Accessories'];
  container.innerHTML = '<div class="category-slider" id="categorySlider"></div>';
  categories.forEach(function (c) {
    var btn = document.createElement('button');
    btn.className = 'category-tab' + (c === currentCategory ? ' active' : '');
    btn.textContent = c;
    btn.onclick = function () { switchCategory(c); };
    container.appendChild(btn);
  });
  requestAnimationFrame(function () { positionCategorySlider(); });
}

function positionCategorySlider() {
  var active = document.querySelector('.category-tab.active');
  var slider = document.getElementById('categorySlider');
  if (!active || !slider) return;
  var container = slider.parentElement;
  if (!container) return;
  var containerRect = container.getBoundingClientRect();
  var activeRect = active.getBoundingClientRect();
  slider.style.width = activeRect.width + 'px';
  slider.style.transform = 'translateX(' + (activeRect.left - containerRect.left + container.scrollLeft) + 'px)';
}

function switchCategory(category) {
  currentCategory = category;
  document.querySelectorAll('.category-tab').forEach(function (el) {
    el.classList.toggle('active', el.textContent === category);
  });
  positionCategorySlider();
  renderProducts();
}

function loadProducts() {
  loadCategoryTabs();
  showProductSkeletons();
  var cached = sheets_getCached('products');
  if (cached && cached.length) {
    allProducts = cached;
    renderProducts();
    loadTrending();
    return;
  }
  sheets_getAll('products').then(function (data) {
    allProducts = data || [];
    sheets_setCache('products', allProducts);
    renderProducts();
    loadTrending();
  });
}

function showProductSkeletons() {
  var grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = Array(6).fill('\
    <div class="skeleton-card">\
      <div class="skeleton skeleton-card-img"></div>\
      <div class="skeleton-card-body">\
        <div class="skeleton skeleton-line" style="width: 40%"></div>\
        <div class="skeleton skeleton-line"></div>\
        <div class="skeleton skeleton-line" style="width: 50%"></div>\
      </div>\
    </div>').join('');
}

function renderProducts() {
  var grid = document.getElementById('productGrid');
  if (!grid) return;
  var searchInput = document.getElementById('searchInput');
  var searchTerm = (searchInput ? searchInput.value : '').toLowerCase();
  var stockFilterEl = document.getElementById('stockFilter');
  var stockFilter = stockFilterEl ? stockFilterEl.value : 'all';
  var sortSelect = document.getElementById('sortSelect');
  var sortBy = sortSelect ? sortSelect.value : 'default';
  var filtered = allProducts.filter(function (p) {
    if (p.category !== currentCategory) return false;
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (searchTerm && !(p.name ? p.name.toLowerCase().includes(searchTerm) : false) && !(p.brand ? p.brand.toLowerCase().includes(searchTerm) : false)) return false;
    if (stockFilter === 'in-stock' && p.stock !== 'In Stock') return false;
    if (stockFilter === 'out-of-stock' && p.stock !== 'Out of Stock') return false;
    return true;
  });
  if (sortBy === 'price-asc') filtered.sort(function (a, b) { return a.price - b.price; });
  else if (sortBy === 'price-desc') filtered.sort(function (a, b) { return b.price - a.price; });
  else if (sortBy === 'latest') filtered.sort(function (a, b) { return b.createdAt - a.createdAt; });
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><h3>No products found</h3><p>Try adjusting your filters or search term</p></div>';
    return;
  }
  grid.innerHTML = filtered.map(function (p) {
    var isOut = p.stock === 'Out of Stock';
    var discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return '\
      <div class="product-card" data-product-id="' + p.id + '">\
        <div class="product-card-img-wrap">\
          <img class="product-card-img" src="' + (p.image || '') + '" alt="' + (p.name || '').replace(/"/g, '&quot;') + '" loading="lazy" onerror="this.parentElement.style.background=\'var(--surface-container-high)\'">\
        </div>\
        ' + (discount > 0 ? '<span class="product-card-badge badge-sale">-' + discount + '%</span>' : '') + '\
        ' + (isOut ? '<span class="product-card-badge badge-out">Out of Stock</span>' : '') + '\
        <div class="product-card-body">\
          <div class="product-card-brand">' + (p.brand || '') + '</div>\
          <div class="product-card-name">' + (p.name || '').replace(/"/g, '&quot;') + '</div>\
          <div class="product-card-pricing">\
            <span class="product-card-price">\u20b9' + Number(p.price).toLocaleString() + '</span>\
            ' + (p.oldPrice ? '<span class="product-card-old">\u20b9' + Number(p.oldPrice).toLocaleString() + '</span>' : '') + '\
          </div>\
          <div class="product-card-actions">\
            ' + (p.url ? '<a href="' + p.url.replace(/"/g, '&quot;') + '" target="_blank" class="product-card-btn btn-primary">Quick View</a>' : '') + '\
            ' + (p.specs ? '<button class="product-card-btn btn-outline enquire-btn" data-enquire="' + p.id + '">Enquire</button>' : '') + '\
          </div>\
        </div>\
      </div>';
  }).join('');
}

document.addEventListener('click', function (e) {
  var btn = e.target.closest('.enquire-btn');
  if (!btn) return;
  var id = btn.getAttribute('data-enquire');
  var product = allProducts.find(function (pr) { return pr.id === id; });
  if (product) openSpecsModal(product.name, product.specs);
});

function openSpecsModal(name, specs) {
  document.getElementById('specsModalTitle').textContent = name + ' - Specifications';
  var body = document.getElementById('specsModalBody');
  if (specs) {
    body.innerHTML = specs.split('\n').filter(Boolean).map(function (line) {
      var sep = line.indexOf(':') > 0 ? ': ' : ' \u2014 ';
      var parts = line.split(sep);
      if (parts.length > 1) {
        return '<div class="specs-row"><span class="specs-key">' + parts[0].trim() + '</span><span class="specs-val">' + parts.slice(1).join(sep).trim() + '</span></div>';
      }
      return '<div class="specs-row"><span class="specs-val" style="grid-column:span 2;">' + line + '</span></div>';
    }).join('');
  } else {
    body.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:2rem 0;">No specifications available</p>';
  }
  document.getElementById('specsOverlay').classList.add('show');
  document.getElementById('specsModal').classList.add('show');
}

function closeSpecsModal() {
  document.getElementById('specsOverlay').classList.remove('show');
  document.getElementById('specsModal').classList.remove('show');
}

function filterProducts() { renderProducts(); }
function sortProducts() { renderProducts(); }

function loadPromotions() {
  var grid = document.getElementById('promoGrid');
  if (!grid) return;
  grid.innerHTML = staticPromotions.map(function (s) {
    var imgHtml = s.image ? '<img class="promo-card-img" src="' + s.image + '" alt="' + s.title + '" loading="lazy" onerror="this.style.display=\'none\'">' : '';
    return '\
      <div class="promo-card">\
        ' + imgHtml + '\
        <div class="promo-card-overlay">\
          <h3>' + (s.title || '') + '</h3>\
          <p>' + (s.description || '') + '</p>\
        </div>\
      </div>';
  }).join('');
}

var allRepairs = [];

function loadAllRepairs() {
  sheets_getAll('repairs').then(function (data) {
    allRepairs = data || [];
  });
}

function trackRepair() {
  var input = document.getElementById('repairCodeInput');
  var result = document.getElementById('repairResult');
  if (!input || !result) return;
  var phone = input.value.trim();
  if (!phone) { showToast('Please enter a mobile number', 'error'); return; }
  var match = allRepairs.find(function (r) { return r.phone && String(r.phone).trim() === phone; });
  if (!match) {
    result.innerHTML = '<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><h3>No repair found</h3><p>No repair record matches this mobile number</p></div>';
    return;
  }
  var statusClass = 'status-' + (match.status ? match.status.toLowerCase().replace(' ', '') : '');
  result.innerHTML = '\
    <div class="repair-result-card">\
      <div class="repair-result-header">\
        <div class="repair-result-device">\
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>\
          ' + (match.device || 'Unknown Device') + '\
        </div>\
        <span class="repair-status ' + statusClass + '">' + (match.status || 'Pending') + '</span>\
      </div>\
      <div class="repair-result-body">\
        <div class="repair-result-row"><span class="repair-result-label">Customer</span><span>' + (match.customer || 'Unknown') + '</span></div>\
        <div class="repair-result-row"><span class="repair-result-label">Phone</span><span>' + (match.phone || '') + '</span></div>\
        <div class="repair-result-row"><span class="repair-result-label">Issue</span><span>' + (match.issue || '') + '</span></div>\
        <div class="repair-result-row"><span class="repair-result-label">Cost</span><span>\u20b9' + Number(match.cost || 0).toLocaleString() + '</span></div>\
      </div>\
    </div>';
}
