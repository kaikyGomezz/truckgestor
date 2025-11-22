// public/js/app.js
const API_BASE = '';

// Elementos principais
const loginVideo = document.getElementById('login-video-bg');
const loginPage = document.getElementById('login-page');
const adminPage = document.getElementById('admin-page');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');

const navButtons = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

// começa só com login
adminPage.style.display = 'none';
if (loginVideo) loginVideo.style.display = 'block';

let currentSectionIndex = 0; // dashboard = 0

// ===== LOGIN =====
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-user').value;
  const password = document.getElementById('login-pass').value;

  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      alert('Usuário ou senha inválidos');
      return;
    }

    loginPage.style.display = 'none';
    if (loginVideo) loginVideo.style.display = 'none';

    adminPage.style.display = 'flex';
    adminPage.classList.add('page-enter');
    setTimeout(() => adminPage.classList.remove('page-enter'), 500);

    initApp();
  } catch (err) {
    console.error(err);
    alert('Erro ao fazer login');
  }
});

function doLogout() {
  adminPage.style.display = 'none';
  if (loginVideo) loginVideo.style.display = 'block';
  loginPage.style.display = 'flex';
  loginPage.classList.add('page-enter');
  setTimeout(() => loginPage.classList.remove('page-enter'), 500);

  loginForm.reset();
  document.getElementById('login-user').focus();
}

logoutBtn.addEventListener('click', doLogout);

// ===== NAVEGAÇÃO ENTRE SEÇÕES =====
navButtons.forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-section');
    if (!targetId) return;

    const direction = idx > currentSectionIndex ? 'right' : 'left';
    currentSectionIndex = idx;

    navButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    contentSections.forEach((sec) => {
      sec.classList.remove('slide-in-left', 'slide-in-right');

      if (sec.id === targetId) {
        sec.classList.add('active');
        void sec.offsetWidth;
        sec.classList.add(direction === 'right' ? 'slide-in-right' : 'slide-in-left');
      } else {
        sec.classList.remove('active');
      }
    });
  });
});

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/api/dashboard`);
    if (!res.ok) return;

    const data = await res.json();

    const totalSpan = document.getElementById('summary-total');
    const monthSpan = document.getElementById('summary-month');
    const countSpan = document.getElementById('summary-count');
    const topDriverSpan = document.getElementById('summary-top-driver');
    const topDriverTotalSpan = document.getElementById('summary-top-driver-total');

    const formatMoney = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

    totalSpan.textContent = formatMoney(data.totalMonth);
    monthSpan.textContent = `Mês: ${data.month}`;
    countSpan.textContent = data.countMonth || 0;

    if (data.topDriver) {
      topDriverSpan.textContent = data.topDriver.name;
      topDriverTotalSpan.textContent = formatMoney(data.topDriver.total);
    } else {
      topDriverSpan.textContent = '—';
      topDriverTotalSpan.textContent = 'R$ 0,00';
    }
  } catch (err) {
    console.error('Erro ao carregar dashboard', err);
  }
}

// ===== CARREGAR LISTAS =====
async function loadDrivers() {
  const res = await fetch(`${API_BASE}/api/drivers`);
  const drivers = await res.json();

  const list = document.getElementById('drivers-list');
  const selectExpense = document.getElementById('expense-driver');
  const selectFilter = document.getElementById('filter-driver');

  list.innerHTML = '';
  selectExpense.innerHTML = '<option value="">Nenhum</option>';
  selectFilter.innerHTML = '<option value="">Todos</option>';

  drivers.forEach((d) => {
    const li = document.createElement('li');
    li.textContent =
      d.name +
      (d.phone ? ` (${d.phone})` : '') +
      (d.status && d.status !== 'ativo' ? ` [${d.status}]` : '');
    list.appendChild(li);

    if (d.status === 'ativo') {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.name;
      selectExpense.appendChild(opt);

      const opt2 = document.createElement('option');
      opt2.value = d.id;
      opt2.textContent = d.name;
      selectFilter.appendChild(opt2);
    }
  });
}

async function loadTrucks() {
  const res = await fetch(`${API_BASE}/api/trucks`);
  const trucks = await res.json();

  const list = document.getElementById('trucks-list');
  const selectExpense = document.getElementById('expense-truck');
  const selectFilter = document.getElementById('filter-truck');

  list.innerHTML = '';
  selectExpense.innerHTML = '<option value="">Nenhum</option>';
  selectFilter.innerHTML = '<option value="">Todos</option>';

  trucks.forEach((t) => {
    const li = document.createElement('li');
    li.textContent =
      `${t.plate || ''} ${t.model ? '- ' + t.model : ''}` +
      (t.year ? ` (${t.year})` : '') +
      (t.status && t.status !== 'ativo' ? ` [${t.status}]` : '');
    list.appendChild(li);

    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.plate;
    selectExpense.appendChild(opt);

    const opt2 = document.createElement('option');
    opt2.value = t.id;
    opt2.textContent = t.plate;
    selectFilter.appendChild(opt2);
  });
}

async function loadTrailers() {
  const res = await fetch(`${API_BASE}/api/trailers`);
  const trailers = await res.json();

  const list = document.getElementById('trailers-list');
  const selectExpense = document.getElementById('expense-trailer');
  const selectFilter = document.getElementById('filter-trailer');

  list.innerHTML = '';
  selectExpense.innerHTML = '<option value="">Nenhuma</option>';
  selectFilter.innerHTML = '<option value="">Todas</option>';

  trailers.forEach((tr) => {
    const li = document.createElement('li');
    li.textContent =
      `${tr.plate || ''} ${tr.type ? '- ' + tr.type : ''}` +
      (tr.year ? ` (${tr.year})` : '') +
      (tr.status && tr.status !== 'ativa' ? ` [${tr.status}]` : '');
    list.appendChild(li);

    const opt = document.createElement('option');
    opt.value = tr.id;
    opt.textContent = tr.plate;
    selectExpense.appendChild(opt);

    const opt2 = document.createElement('option');
    opt2.value = tr.id;
    opt2.textContent = tr.plate;
    selectFilter.appendChild(opt2);
  });
}

async function loadTires() {
  const res = await fetch(`${API_BASE}/api/tires`);
  const tires = await res.json();

  const list = document.getElementById('tires-list');
  const selectExpense = document.getElementById('expense-tire');
  const selectFilter = document.getElementById('filter-tire');

  list.innerHTML = '';
  selectExpense.innerHTML = '<option value="">Nenhum</option>';
  selectFilter.innerHTML = '<option value="">Todos</option>';

  tires.forEach((ti) => {
    const li = document.createElement('li');
    li.textContent =
      `${ti.code}` +
      (ti.brand ? ` - ${ti.brand}` : '') +
      (ti.model ? ` (${ti.model})` : '') +
      (ti.state ? ` [${ti.state}]` : '');
    list.appendChild(li);

    const opt = document.createElement('option');
    opt.value = ti.id;
    opt.textContent = ti.code;
    selectExpense.appendChild(opt);

    const opt2 = document.createElement('option');
    opt2.value = ti.id;
    opt2.textContent = ti.code;
    selectFilter.appendChild(opt2);
  });
}

async function loadCategories() {
  const res = await fetch(`${API_BASE}/api/categories`);
  const categories = await res.json();

  const selectExpense = document.getElementById('expense-category');
  const selectFilter = document.getElementById('filter-category');

  selectExpense.innerHTML = '';
  selectFilter.innerHTML = '<option value="">Todas</option>';

  categories.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    selectExpense.appendChild(opt);

    const opt2 = document.createElement('option');
    opt2.value = c.id;
    opt2.textContent = c.name;
    selectFilter.appendChild(opt2);
  });
}

async function loadExpenses() {
  const params = new URLSearchParams();

  const filterDriver = document.getElementById('filter-driver').value;
  const filterTruck = document.getElementById('filter-truck').value;
  const filterTrailer = document.getElementById('filter-trailer').value;
  const filterTire = document.getElementById('filter-tire').value;
  const filterCategory = document.getElementById('filter-category').value;
  const filterStart = document.getElementById('filter-start').value;
  const filterEnd = document.getElementById('filter-end').value;

  if (filterDriver) params.append('driver_id', filterDriver);
  if (filterTruck) params.append('truck_id', filterTruck);
  if (filterTrailer) params.append('trailer_id', filterTrailer);
  if (filterTire) params.append('tire_id', filterTire);
  if (filterCategory) params.append('category_id', filterCategory);
  if (filterStart) params.append('start_date', filterStart);
  if (filterEnd) params.append('end_date', filterEnd);

  const res = await fetch(`${API_BASE}/api/expenses?` + params.toString());
  const data = await res.json();

  const tbody = document.querySelector('#expenses-table tbody');
  const totalDisplay = document.getElementById('total-display');
  const totalByDriverDiv = document.getElementById('total-by-driver');

  tbody.innerHTML = '';

  data.expenses.forEach((e) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${e.date || ''}</td>
      <td>${e.driver_name || ''}</td>
      <td>${e.truck_plate || ''}</td>
      <td>${e.trailer_plate || ''}</td>
      <td>${e.tire_code || ''}</td>
      <td>${e.category_name || ''}</td>
      <td>${(e.value || 0).toFixed(2)}</td>
      <td>${e.invoice_number || ''}</td>
      <td>${e.supplier || ''}</td>
      <td>${e.odometer != null ? e.odometer : ''}</td>
      <td>${e.description || ''}</td>
    `;
    tbody.appendChild(tr);
  });

  totalDisplay.textContent = 'Total: R$ ' + (data.total || 0).toFixed(2);

  if (data.totalByDriver && data.totalByDriver.length > 0) {
    let html = '<strong>Total por motorista:</strong><ul>';
    data.totalByDriver.forEach((td) => {
      html += `<li>${td.driver_name}: R$ ${td.total.toFixed(2)}</li>`;
    });
    html += '</ul>';
    totalByDriverDiv.innerHTML = html;
  } else {
    totalByDriverDiv.innerHTML = '';
  }
}

// ===== EXPORT CSV =====
async function exportCsv() {
  const params = new URLSearchParams();

  const filterDriver = document.getElementById('filter-driver').value;
  const filterTruck = document.getElementById('filter-truck').value;
  const filterTrailer = document.getElementById('filter-trailer').value;
  const filterTire = document.getElementById('filter-tire').value;
  const filterCategory = document.getElementById('filter-category').value;
  const filterStart = document.getElementById('filter-start').value;
  const filterEnd = document.getElementById('filter-end').value;

  if (filterDriver) params.append('driver_id', filterDriver);
  if (filterTruck) params.append('truck_id', filterTruck);
  if (filterTrailer) params.append('trailer_id', filterTrailer);
  if (filterTire) params.append('tire_id', filterTire);
  if (filterCategory) params.append('category_id', filterCategory);
  if (filterStart) params.append('start_date', filterStart);
  if (filterEnd) params.append('end_date', filterEnd);

  try {
    const res = await fetch(`${API_BASE}/api/expenses/export?` + params.toString());
    if (!res.ok) {
      alert('Erro ao exportar CSV');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gastos.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Erro ao exportar CSV', err);
    alert('Erro ao exportar CSV');
  }
}

document.getElementById('btn-export-csv').addEventListener('click', exportCsv);

// ===== SUBMIT FORMS =====
document.getElementById('driver-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('driver-name').value;
  const phone = document.getElementById('driver-phone').value;
  const cnh = document.getElementById('driver-cnh').value;
  const status = document.getElementById('driver-status').value;

  const res = await fetch(`${API_BASE}/api/drivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, cnh, status }),
  });

  if (!res.ok) {
    alert('Erro ao salvar motorista');
    return;
  }

  e.target.reset();
  loadDrivers();
  loadDashboard();
});

document.getElementById('truck-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const plate = document.getElementById('truck-plate').value;
  const model = document.getElementById('truck-model').value;
  const year = document.getElementById('truck-year').value;
  const odometer = document.getElementById('truck-odometer').value;
  const status = document.getElementById('truck-status').value;

  const res = await fetch(`${API_BASE}/api/trucks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plate, model, year, odometer, status }),
  });

  if (!res.ok) {
    alert('Erro ao salvar cavalo');
    return;
  }

  e.target.reset();
  loadTrucks();
});

document.getElementById('trailer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const plate = document.getElementById('trailer-plate').value;
  const type = document.getElementById('trailer-type').value;
  const year = document.getElementById('trailer-year').value;
  const status = document.getElementById('trailer-status').value;

  const res = await fetch(`${API_BASE}/api/trailers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plate, type, year, status }),
  });

  if (!res.ok) {
    alert('Erro ao salvar carreta');
    return;
  }

  e.target.reset();
  loadTrailers();
});

document.getElementById('tire-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('tire-code').value;
  const brand = document.getElementById('tire-brand').value;
  const model = document.getElementById('tire-model').value;
  const purchase_date = document.getElementById('tire-purchase-date').value;
  const purchase_value = document.getElementById('tire-purchase-value').value;
  const state = document.getElementById('tire-state').value;

  const res = await fetch(`${API_BASE}/api/tires`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      brand,
      model,
      purchase_date,
      purchase_value: purchase_value ? Number(purchase_value) : null,
      state,
    }),
  });

  if (!res.ok) {
    alert('Erro ao salvar pneu');
    return;
  }

  e.target.reset();
  loadTires();
});

document.getElementById('expense-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const driver_id = document.getElementById('expense-driver').value || null;
  const truck_id = document.getElementById('expense-truck').value || null;
  const trailer_id = document.getElementById('expense-trailer').value || null;
  const tire_id = document.getElementById('expense-tire').value || null;
  const category_id = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value;
  const value = parseFloat(document.getElementById('expense-value').value);
  const odometer = document.getElementById('expense-odometer').value || null;
  const invoice_number = document.getElementById('expense-invoice').value;
  const supplier = document.getElementById('expense-supplier').value;
  const description = document.getElementById('expense-description').value;

  const res = await fetch(`${API_BASE}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      driver_id,
      truck_id,
      trailer_id,
      tire_id,
      category_id,
      date,
      value,
      odometer: odometer ? Number(odometer) : null,
      invoice_number,
      supplier,
      description,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert('Erro ao salvar gasto: ' + (err.error || ''));
    return;
  }

  e.target.reset();
  loadExpenses();
  loadDashboard();
});

document.getElementById('filter-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  loadExpenses();
});

// ===== INICIALIZAÇÃO =====
async function initApp() {
  await loadDrivers();
  await loadTrucks();
  await loadTrailers();
  await loadTires();
  await loadCategories();
  await loadExpenses();
  await loadDashboard();
}

// ===== PARALLAX LEVE =====
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  document.body.style.backgroundPositionY = `${y * -0.15}px`;
});

