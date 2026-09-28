// ============================================================
// Milk Manager — app logic
// ============================================================

// --- SMALL UTILITIES ---
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


// --- CUSTOM DROPDOWN (fully-styled replacement for native <select>) ---
function initCustomDropdown(select) {
  if (!select || select.dataset.customized === 'true') return;
  select.dataset.customized = 'true';

  const wrapper = document.createElement('div');
  wrapper.className = 'dropdown-wrapper';
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);
  select.classList.add('dropdown-native-select');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'dropdown-toggle';
  toggle.innerHTML = `<span class="dropdown-toggle-label"></span><span class="dropdown-arrow"></span>`;
  wrapper.appendChild(toggle);

  const menu = document.createElement('ul');
  menu.className = 'dropdown-menu';
  wrapper.appendChild(menu);

  function rebuild() {
    const label = toggle.querySelector('.dropdown-toggle-label');
    menu.innerHTML = '';
    Array.from(select.options).forEach(opt => {
      const li = document.createElement('li');
      li.className = 'dropdown-option';
      li.textContent = opt.textContent;
      if (opt.value === select.value) {
        li.classList.add('selected');
        label.textContent = opt.textContent;
      }
      li.onclick = () => {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        rebuild();
        wrapper.classList.remove('open');
      };
      menu.appendChild(li);
    });
  }

  toggle.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll('.dropdown-wrapper.open').forEach(w => { if (w !== wrapper) w.classList.remove('open'); });
    wrapper.classList.toggle('open');
  };
  document.addEventListener('click', (e) => { if (!wrapper.contains(e.target)) wrapper.classList.remove('open'); });

  new MutationObserver(rebuild).observe(select, { childList: true });
  select._refreshDropdown = rebuild;
  rebuild();
}

function refreshDropdownUI(select) {
  if (select && select._refreshDropdown) select._refreshDropdown();
}

document.querySelectorAll('.custom-select').forEach(initCustomDropdown);



// JSON.parse throws on corrupted/partial localStorage data
function safeParse(json, fallback) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch (err) {
    console.error('Milk Manager: ignoring corrupted saved data', err);
    return fallback;
  }
}

function formatMoney(n) {
  return `${(Number(n) || 0).toLocaleString('fr-FR')} DA`;
}

function clampNonNegative(value) {
  return Math.max(0, parseFloat(value) || 0);
}

// --- TAB NAVIGATION ---
const buttons = document.querySelectorAll('.tab-button');
const screens = document.querySelectorAll('.screen');

function showScreen(targetId) {
  screens.forEach((screen) => {
    screen.classList.toggle('active', screen.id === targetId);
  });
  buttons.forEach((button) => {
    button.classList.toggle('active', button.dataset.target === targetId);
  });
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    showScreen(button.dataset.target);
  });
});

// --- TODAY'S DATE LABEL ---
const todayDateLabel = document.getElementById('today-date-label');
if (todayDateLabel) {
  todayDateLabel.textContent = new Date().toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

// --- PRICES & STORAGE ---
const DEFAULT_PRICES = { milk: 345, lben: 1200, isLocked: false };

function getPrices() { return safeParse(localStorage.getItem('milk_app_prices'), DEFAULT_PRICES); }
function savePrices(prices) { localStorage.setItem('milk_app_prices', JSON.stringify(prices)); }

function loadPricesUI() {
  const prices = getPrices();
  const milkInput = document.getElementById('milk-price');
  const lbenInput = document.getElementById('lben-price');
  const displayView = document.getElementById('prices-display-view');
  const editView = document.getElementById('prices-edit-view');
  const milkDisplay = document.getElementById('milk-price-display');
  const lbenDisplay = document.getElementById('lben-price-display');

  if (milkInput) milkInput.value = prices.milk;
  if (lbenInput) lbenInput.value = prices.lben;
  if (milkDisplay) milkDisplay.textContent = formatMoney(prices.milk);
  if (lbenDisplay) lbenDisplay.textContent = formatMoney(prices.lben);

  if (prices.isLocked) {
    if (displayView) displayView.style.display = 'flex';
    if (editView) editView.style.display = 'none';
  } else {
    if (displayView) displayView.style.display = 'none';
    if (editView) editView.style.display = 'block';
  }
}

const savePricesBtn = document.getElementById('save-prices-btn');
const editPricesBtn = document.getElementById('edit-prices-btn');
const priceStatus = document.getElementById('price-status');

if (savePricesBtn) {
  savePricesBtn.addEventListener('click', () => {
    savePrices({ 
      milk: clampNonNegative(document.getElementById('milk-price').value), 
      lben: clampNonNegative(document.getElementById('lben-price').value), 
      isLocked: true 
    });
    loadPricesUI();
    if (priceStatus) {
      priceStatus.textContent = 'Prix enregistrés et verrouillés !';
      setTimeout(() => { priceStatus.textContent = ''; }, 2500);
    }
  });
}

if (editPricesBtn) {
  editPricesBtn.addEventListener('click', () => {
    const prices = getPrices();
    prices.isLocked = false;
    savePrices(prices);
    loadPricesUI();
  });
}
loadPricesUI();

// --- SALES & STOCK STORAGE ---
function getSales() { return safeParse(localStorage.getItem('milk_app_sales'), []); }
function saveSales(salesArray) { localStorage.setItem('milk_app_sales', JSON.stringify(salesArray)); }
function getDailyStockArray() { return safeParse(localStorage.getItem('milk_app_daily_stock'), []); }
function saveDailyStockArray(stockArray) { localStorage.setItem('milk_app_daily_stock', JSON.stringify(stockArray)); }

// --- CLIENT MANAGEMENT ---
function getClients() { return safeParse(localStorage.getItem('milk_app_clients'), []); }
function saveClients(clients) {
  localStorage.setItem('milk_app_clients', JSON.stringify(clients));
  renderManageClients();
  renderDailyClients();
}

function renderManageClients() {
  const allClients = getClients();
  const listEl = document.getElementById('manage-client-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const activeClients = allClients.filter(c => c.isActive !== false);
  const archivedClients = allClients.filter(c => c.isActive === false);

  if (allClients.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">Aucun client ajouté pour le moment.</p>';
    return;
  }

  activeClients.forEach(client => {
    const li = document.createElement('li');
    li.className = 'client-list-item-clickable';
    li.innerHTML = `
      <span class="client-name">${escapeHtml(client.name)}</span>
      <button class="delete-btn">Archiver</button>
    `;
    li.onclick = () => openEditClientModal(client.id);
    li.querySelector('.delete-btn').onclick = (e) => {
      e.stopPropagation();
      if (confirm(`Archiver ${client.name} ? L'historique reste conservé.`)) archiveClient(client.id);
    };
    listEl.appendChild(li);
  });

  if (archivedClients.length > 0) {
    const details = document.createElement('details');
    details.className = 'archived-details';
    details.innerHTML = `<summary class="archived-summary">Clients archivés (${archivedClients.length})</summary><ul class="client-list archived-ul"></ul>`;
    const archivedUl = details.querySelector('.archived-ul');

    archivedClients.forEach(client => {
      const li = document.createElement('li');
      li.className = 'archived-item';
      li.innerHTML = `<span class="client-name">${escapeHtml(client.name)}</span><button class="secondary-btn restore-btn">Restaurer</button>`;
      li.querySelector('.restore-btn').onclick = () => restoreClient(client.id);
      archivedUl.appendChild(li);
    });
    listEl.appendChild(details);
  }
}

function archiveClient(id) {
  const clients = getClients();
  const client = clients.find(c => c.id === id);
  if (client) { client.isActive = false; saveClients(clients); }
}

function restoreClient(id) {
  const clients = getClients();
  const client = clients.find(c => c.id === id);
  if (client) { client.isActive = true; saveClients(clients); }
}

// --- EDIT CLIENT MODAL ---
let currentEditClientId = null;
const editClientModal = document.getElementById('edit-client-modal');
const editClientNameInput = document.getElementById('edit-client-name');
const editClientGroupSelect = document.getElementById('edit-client-group-select');
const editClientStatus = document.getElementById('edit-client-status');

function openEditClientModal(clientId) {
  const client = getClients().find(c => c.id === clientId);
  if (!client) return;
  currentEditClientId = clientId;

  if (editClientNameInput) editClientNameInput.value = client.name;
  if (editClientStatus) editClientStatus.textContent = '';

  if (editClientGroupSelect) {
    let options = '<option value="">Aucun</option>';
    getGroups().forEach(group => {
      options += `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`;
    });
    editClientGroupSelect.innerHTML = options;
    editClientGroupSelect.value = client.groupId || '';
    refreshDropdownUI(editClientGroupSelect); 
  }

  editClientModal?.classList.add('active');
}

function closeEditClientModal() {
  editClientModal?.classList.remove('active');
  currentEditClientId = null;
}

document.getElementById('save-edit-client-btn')?.addEventListener('click', () => {
  if (!currentEditClientId) return;
  const name = editClientNameInput.value.trim();
  if (!name) {
    if (editClientStatus) editClientStatus.textContent = 'Le nom ne peut pas être vide.';
    return;
  }
  const clients = getClients();
  const client = clients.find(c => c.id === currentEditClientId);
  if (client) {
    client.name = name;
    client.groupId = editClientGroupSelect ? editClientGroupSelect.value : client.groupId;
    saveClients(clients);
  }
  closeEditClientModal();
});

document.getElementById('cancel-edit-client-btn')?.addEventListener('click', closeEditClientModal);

document.getElementById('edit-client-archive-btn')?.addEventListener('click', () => {
  if (!currentEditClientId) return;
  const client = getClients().find(c => c.id === currentEditClientId);
  if (client && confirm(`Archiver ${client.name} ? L'historique reste conservé.`)) {
    archiveClient(currentEditClientId);
    closeEditClientModal();
  }
});

const addClientBtn = document.getElementById('add-client-btn');
const newClientInput = document.getElementById('new-client-name');

if (addClientBtn) {
  addClientBtn.addEventListener('click', () => {
    const name = newClientInput.value.trim();
    if (!name) return;
    const groupSelect = document.getElementById('client-group-select');
    const clients = getClients();
    
    clients.push({
      id: Date.now(),
      name: name,
      isActive: true,
      groupId: groupSelect ? groupSelect.value : ''
    });
    
    saveClients(clients);
    newClientInput.value = '';
    if (groupSelect) groupSelect.value = '';
    refreshDropdownUI(groupSelect); 
  });
}

// --- UTILS FOR DATE MATCHING ---
function isToday(dateString) { return isSameDay(dateString, new Date()); }
function isYesterday(dateString) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(dateString, yesterday);
}
function isSameDay(dateA, dateB) {
  const a = new Date(dateA), b = new Date(dateB);
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}
function hasLoggedSaleToday(clientId, salesForDay) {
  return salesForDay.some(s => s.clientId === clientId);
}

// --- UI CARD BUILDER FOR CLIENTS ---
function createClientCardElement(client, salesForDay) {
  const cSales = salesForDay.filter(s => s.clientId === client.id);
  const card = document.createElement('div');
  const safeName = escapeHtml(client.name);

  if (cSales.length > 0) {
    const totalMilk = cSales.reduce((sum, s) => sum + (parseFloat(s.milkQty) || 0), 0);
    const totalLben = cSales.reduce((sum, s) => sum + (parseFloat(s.lbenQty) || 0), 0);
    const totalAmount = cSales.reduce((sum, s) => sum + (parseFloat(s.totalAmount) || 0), 0);
    const totalPaid = cSales.reduce((sum, s) => sum + (parseFloat(s.paidAmount) || 0), 0);
    const isFullyPaid = totalPaid >= totalAmount;
    const statusClass = isFullyPaid ? 'paid' : 'unpaid';

    card.className = `client-card has-sale ${statusClass}`;
    card.innerHTML = `
      <div class="client-card-info">
        <span class="client-name">${safeName}</span>
        <span class="client-sale-summary">Lait : <strong>${totalMilk}</strong> | Lben : <strong>${totalLben}</strong></span>
      </div>
      <div class="client-amount-block">
        <span class="client-amount client-amount--${statusClass}">${formatMoney(totalAmount)}</span>
        <div class="client-status-line client-status-line--${statusClass}">
          ${isFullyPaid ? 'Payé intégralement' : `Doit ${formatMoney(totalAmount - totalPaid)}`}
        </div>
      </div>
    `;
  } else {
    card.className = 'client-card';
    card.innerHTML = `<span class="client-name">${safeName}</span><span class="tap-hint">Appuyer pour ajouter</span>`;
  }
  card.onclick = () => openSaleModal(client.id, client.name);
  return card;
}

// --- DAILY SALES INTERFACE ---
let currentSelectedClientId = null;
let currentSaleId = null;
let clearPastCratesFlag = false;
let clearPastDebtFlag = false;
let lastSaleIdForCrates = null;

const saleModal = document.getElementById('sale-modal');
const milkQtyInput = document.getElementById('sale-milk-qty');
const lbenQtyInput = document.getElementById('sale-lben-qty');
const totalPriceLabel = document.getElementById('sale-total-price');
const paidAmountInput = document.getElementById('sale-paid-amount');
const remainingFundsInput = document.getElementById('sale-remaining-funds');
const remainingMoneyLabel = document.getElementById('sale-remaining-money');
const tomorrowMilkInput = document.getElementById('sale-tomorrow-milk');
const tomorrowLbenInput = document.getElementById('sale-tomorrow-lben');

function getGroupMoneyStats(groupClients, todaySales) {
  const ids = new Set(groupClients.map(c => String(c.id)));
  let total = 0, paid = 0;
  todaySales.forEach(s => {
    if (!ids.has(String(s.clientId))) return;
    total += parseFloat(s.totalAmount) || 0;
    paid += parseFloat(s.paidAmount) || 0;
  });
  return { total, paid, left: Math.max(0, total - paid) };
}

function groupBadgeHtml(hasPendingSales, groupClients, todaySales) {
  const { total, paid, left } = getGroupMoneyStats(groupClients, todaySales);
  if (total === 0) return '';
  return `
    <div class="group-money-row">
      <span class="money-chip">Total <strong>${formatMoney(total)}</strong></span>
      <span class="money-chip money-chip--paid">Payé <strong>${formatMoney(paid)}</strong></span>
      ${left > 0 ? `<span class="money-chip money-chip--left">Reste <strong>${formatMoney(left)}</strong></span>` : ''}
    </div>`;
}

// Replaces the scattered group logic into one unified view
function renderDailyClients() {
  const container = document.getElementById('daily-clients-grid');
  if (!container) return;

  const clients = getClients().filter(c => c.isActive !== false);
  const groups = getGroups();
  const sales = getSales();
  const todaySales = sales.filter(s => isToday(s.date));

  const groupedData = {};
  groups.forEach(g => { groupedData[g.id] = { info: g, clients: [] }; });
  const unassignedClients = [];

  clients.forEach(client => {
    if (client.groupId && groupedData[client.groupId]) {
      groupedData[client.groupId].clients.push(client);
    } else {
      unassignedClients.push(client);
    }
  });

  container.innerHTML = '';

  // Render Groups
  Object.values(groupedData).forEach(groupBucket => {
    if (groupBucket.clients.length === 0) return;
    const group = groupBucket.info;
    const groupClients = groupBucket.clients;
    const hasPendingSales = groupClients.some(client => !hasLoggedSaleToday(client.id, todaySales));

    const details = document.createElement('details');
    details.className = 'group-accordion';
    

    const titleText = escapeHtml(group.name);

    details.innerHTML = `
      <summary class="group-summary">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <span class="group-title" style="font-size:15px; font-weight:800;">${titleText} (${groupClients.length})</span>
          <span class="${hasPendingSales ? 'group-badge has-pending' : 'group-badge'}">${hasPendingSales ? 'En attente' : 'Soldé'}</span>
        </div>
        ${groupBadgeHtml(hasPendingSales, groupClients, todaySales)}
      </summary>
      <div class="client-grid" id="group-container-${group.id}" style="margin-top:12px;"></div>
    `;

    container.appendChild(details);
    const groupCardContainer = details.querySelector(`#group-container-${group.id}`);
    groupClients.forEach(c => groupCardContainer.appendChild(createClientCardElement(c, todaySales)));
  });

  // Render Unassigned
  if (unassignedClients.length > 0) {
    const hasPendingSales = unassignedClients.some(client => !hasLoggedSaleToday(client.id, todaySales));
    const details = document.createElement('details');
    details.className = 'group-accordion';
    // if (hasPendingSales) details.open = true;

    details.open = true;
    
    details.innerHTML = `
      <summary class="group-summary">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <span class="group-title" style="font-size:15px; font-weight:800;">Clients non assignés (${unassignedClients.length})</span>
          <span class="${hasPendingSales ? 'group-badge has-pending' : 'group-badge'}">${hasPendingSales ? 'En attente' : 'Soldé'}</span>
        </div>
        ${groupBadgeHtml(hasPendingSales, unassignedClients, todaySales)}
      </summary>
      <div class="client-grid" id="group-container-unassigned" style="margin-top:12px;"></div>
    `;

    container.appendChild(details);
    const unassignedContainer = details.querySelector('#group-container-unassigned');
    unassignedClients.forEach(c => unassignedContainer.appendChild(createClientCardElement(c, todaySales)));
  }
}

function updateCalculations() {
  const prices = getPrices();
  const mQty = parseFloat(milkQtyInput.value) || 0;
  const lQty = parseFloat(lbenQtyInput.value) || 0;
  const total = (mQty * prices.milk) + (lQty * prices.lben);
  
  if (totalPriceLabel) totalPriceLabel.textContent = formatMoney(total);
  const remainingMoney = Math.max(0, total - (parseFloat(paidAmountInput.value) || 0));
  if (remainingMoneyLabel) remainingMoneyLabel.textContent = formatMoney(remainingMoney);
}

function openSaleModal(clientId, clientName) {
  currentSelectedClientId = clientId;
  if (document.getElementById('modal-client-name')) document.getElementById('modal-client-name').textContent = clientName;

  const salesArray = getSales();
  const todaySale = salesArray.find(s => s.clientId === clientId && isToday(s.date));
  const pastSales = salesArray.filter(s => s.clientId === clientId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastSale = pastSales.length > 0 ? pastSales[0] : null;

  currentSaleId = todaySale ? todaySale.id : null;
  milkQtyInput.value = todaySale ? todaySale.milkQty : '';
  lbenQtyInput.value = todaySale ? todaySale.lbenQty : '';
  paidAmountInput.value = todaySale ? todaySale.paidAmount : '';
  remainingFundsInput.value = todaySale ? (todaySale.remainingFunds || '') : '';
  tomorrowMilkInput.value = todaySale ? (todaySale.tomorrowMilk || '') : '';
  tomorrowLbenInput.value = todaySale ? (todaySale.tomorrowLben || '') : '';

  clearPastCratesFlag = false;
  clearPastDebtFlag = false;
  lastSaleIdForCrates = lastSale ? lastSale.id : null;

  const remindersContainer = document.getElementById('modal-reminders');
  if (remindersContainer) {
    remindersContainer.innerHTML = '';
    if (lastSale && !todaySale) {
      if (isYesterday(lastSale.date)) {
        const tMilk = lastSale.tomorrowMilk || 0, tLben = lastSale.tomorrowLben || 0;
        if (tMilk > 0 || tLben > 0) {
          remindersContainer.innerHTML += `<div class="reminder-cloud blue-cloud">🛒 Prévu : <strong>${tMilk} Lait</strong> | <strong>${tLben} Lben</strong></div>`;
        }
      }
      const remCrates = lastSale.remainingFunds || 0;
      if (remCrates > 0) {
        const crateCloud = document.createElement('div');
        crateCloud.className = 'reminder-cloud orange-cloud';
        crateCloud.innerHTML = `📦 Doit : <strong>${remCrates} fonds vides</strong> <button type="button" class="check-funds-btn">✔</button>`;
        crateCloud.querySelector('.check-funds-btn').onclick = () => {
          clearPastCratesFlag = true;
          crateCloud.className = 'reminder-cloud reminder-cloud--done';
          crateCloud.innerHTML = '✅ Fonds retournés (cliquez sur Enregistrer)';
        };
        remindersContainer.appendChild(crateCloud);
      }
    }

    const totalDebt = pastSales.reduce((sum, s) => sum + Math.max(0, (parseFloat(s.totalAmount) || 0) - (parseFloat(s.paidAmount) || 0)), 0);
    if (totalDebt > 0) {
      const debtCloud = document.createElement('div');
      debtCloud.className = 'reminder-cloud red-cloud';
      debtCloud.innerHTML = `💰 Dette : <strong>${formatMoney(totalDebt)}</strong> <button type="button" class="check-funds-btn">✔</button>`;
      debtCloud.querySelector('.check-funds-btn').onclick = () => {
        clearPastDebtFlag = true;
        debtCloud.className = 'reminder-cloud reminder-cloud--done';
        debtCloud.innerHTML = '✅ Dette réglée (cliquez sur Enregistrer)';
      };
      remindersContainer.appendChild(debtCloud);
    }
  }

  updateCalculations();
  saleModal.classList.add('active');
}

[milkQtyInput, lbenQtyInput, paidAmountInput].forEach(el => el && el.addEventListener('input', updateCalculations));

document.getElementById('full-pay-btn')?.addEventListener('click', () => {
  const prices = getPrices();
  paidAmountInput.value = ((parseFloat(milkQtyInput.value) || 0) * prices.milk) + ((parseFloat(lbenQtyInput.value) || 0) * prices.lben);
  updateCalculations();
});

document.getElementById('cancel-sale-btn')?.addEventListener('click', () => {
  saleModal.classList.remove('active');
  currentSelectedClientId = currentSaleId = null;
});

function handleQtyBtn(inputEl, increment) {
  inputEl.value = Math.max(0, (parseInt(inputEl.value) || 0) + increment);
  updateCalculations();
}

[
  ['milk-minus', 'milk-plus', milkQtyInput],
  ['lben-minus', 'lben-plus', lbenQtyInput],
  ['funds-minus', 'funds-plus', remainingFundsInput],
  ['tomorrow-milk-minus', 'tomorrow-milk-plus', tomorrowMilkInput],
  ['tomorrow-lben-minus', 'tomorrow-lben-plus', tomorrowLbenInput]
].forEach(([minusId, plusId, input]) => {
  document.getElementById(minusId)?.addEventListener('click', () => handleQtyBtn(input, -1));
  document.getElementById(plusId)?.addEventListener('click', () => handleQtyBtn(input, 1));
});

document.getElementById('save-sale-btn')?.addEventListener('click', () => {
  if (!currentSelectedClientId) return;
  const prices = getPrices();
  const mQty = clampNonNegative(milkQtyInput.value), lQty = clampNonNegative(lbenQtyInput.value);
  const totalAmount = (mQty * prices.milk) + (lQty * prices.lben);
  
  let salesArray = getSales();
  if (currentSaleId) {
    const saleIndex = salesArray.findIndex(s => s.id === currentSaleId);
    if (saleIndex > -1) {
      Object.assign(salesArray[saleIndex], { milkQty: mQty, lbenQty: lQty, totalAmount, paidAmount: clampNonNegative(paidAmountInput.value), tomorrowMilk: clampNonNegative(tomorrowMilkInput.value), tomorrowLben: clampNonNegative(tomorrowLbenInput.value), remainingFunds: clampNonNegative(remainingFundsInput.value) });
    }
  } else {
    salesArray.push({
      id: Date.now(), clientId: currentSelectedClientId, date: new Date().toISOString(), milkQty: mQty, lbenQty: lQty, totalAmount, paidAmount: clampNonNegative(paidAmountInput.value), tomorrowMilk: clampNonNegative(tomorrowMilkInput.value), tomorrowLben: clampNonNegative(tomorrowLbenInput.value), remainingFunds: clampNonNegative(remainingFundsInput.value)
    });
  }

  if (clearPastCratesFlag && lastSaleIdForCrates) {
    const saleToUpdate = salesArray.find(s => s.id === lastSaleIdForCrates);
    if (saleToUpdate) saleToUpdate.remainingFunds = 0;
  }

  if (clearPastDebtFlag) {
    salesArray.filter(s => s.clientId === currentSelectedClientId).forEach(s => {
      const sTotal = parseFloat(s.totalAmount) || 0;
      if (sTotal > (parseFloat(s.paidAmount) || 0)) s.paidAmount = sTotal;
    });
  }

  saveSales(salesArray);
  renderDailyClients();
  renderHistoryScreen();
  renderDailyStockUI();
  saleModal.classList.remove('active');
});

// --- GROUPS / ROUTES ---
function getGroups() { return safeParse(localStorage.getItem('groups'), []); }
function saveGroups(groups) { localStorage.setItem('groups', JSON.stringify(groups)); }

document.getElementById('addGroupForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('groupNameInput');
  const name = nameInput.value.trim();

  if (!name) return;
  const groups = getGroups();
  groups.push({ id: 'grp_' + Date.now(), name });
  saveGroups(groups);
  
  nameInput.value = '';

  renderGroupsUI();
  populateClientGroupDropdown();
});

function renderGroupsUI() {
  const listEl = document.getElementById('manageGroupsList');
  if (!listEl) return;
  listEl.innerHTML = '';

  const groups = getGroups();
  if (groups.length === 0) {
    listEl.innerHTML = '<p class="empty-hint">Aucun groupe / tournée ajouté.</p>';
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'client-list';
  groups.forEach(group => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div style="display:flex; align-items:center;">
        <span class="client-name">${escapeHtml(group.name)}</span>
      </div>
      <button class="delete-btn">Supprimer</button>
    `;
    li.querySelector('.delete-btn').onclick = () => deleteGroup(group.id);
    ul.appendChild(li);
  });
  listEl.appendChild(ul);
}


function deleteGroup(groupId) {
  saveGroups(getGroups().filter(g => g.id !== groupId));
  saveClients(getClients().map(c => c.groupId === groupId ? { ...c, groupId: '' } : c));
  renderGroupsUI();
  populateClientGroupDropdown();
}

function populateClientGroupDropdown() {
  const select = document.getElementById('client-group-select');
  if (!select) return;
  let options = '<option value="">Aucun (Non assigné)</option>';
  getGroups().forEach(group => {
    options += `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`;
  });
  select.innerHTML = options;
}

// --- DAILY STOCK LOGIC ---
function getDailyStock() {
  const stockArray = getDailyStockArray();
  const todayEntry = stockArray.find(s => isToday(s.date));
  if (todayEntry) return todayEntry;

  if (stockArray.length > 0) {
    const lastEntry = [...stockArray].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const lastDaySales = getSales().filter(s => new Date(s.date).toDateString() === new Date(lastEntry.date).toDateString());
    const carriedMilk = Math.max(0, (parseFloat(lastEntry.milkOwned) || 0) - lastDaySales.reduce((sum, s) => sum + (parseFloat(s.milkQty) || 0), 0));
    const carriedLben = Math.max(0, (parseFloat(lastEntry.lbenOwned) || 0) - lastDaySales.reduce((sum, s) => sum + (parseFloat(s.lbenQty) || 0), 0));
    return { date: new Date().toISOString(), milkOwned: carriedMilk, lbenOwned: carriedLben, isLocked: false };
  }
  return { date: new Date().toISOString(), milkOwned: 0, lbenOwned: 0, isLocked: false };
}

function saveDailyStock(milkOwned, lbenOwned, isLocked) {
  let stockArray = getDailyStockArray();
  const index = stockArray.findIndex(s => isToday(s.date));
  if (index > -1) {
    Object.assign(stockArray[index], { milkOwned, lbenOwned, isLocked });
  } else {
    stockArray.push({ id: Date.now(), date: new Date().toISOString(), milkOwned, lbenOwned, isLocked });
  }
  saveDailyStockArray(stockArray);
}

function renderDailyStockUI() {
  const stock = getDailyStock();
  const milkInput = document.getElementById('stock-milk-owned'), lbenInput = document.getElementById('stock-lben-owned');
  const saveBtn = document.getElementById('save-stock-btn'), editBtn = document.getElementById('edit-stock-btn');

  if (milkInput && document.activeElement !== milkInput) milkInput.value = stock.milkOwned || '';
  if (lbenInput && document.activeElement !== lbenInput) lbenInput.value = stock.lbenOwned || '';

  if (stock.isLocked) {
    if (milkInput) milkInput.disabled = true;
    if (lbenInput) lbenInput.disabled = true;
    if (saveBtn) saveBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'block';
  } else {
    if (milkInput) milkInput.disabled = false;
    if (lbenInput) lbenInput.disabled = false;
    if (saveBtn) saveBtn.style.display = 'block';
    if (editBtn) editBtn.style.display = 'none';
  }

  const todaySales = getSales().filter(s => isToday(s.date));
  const totalMilkSold = todaySales.reduce((sum, s) => sum + (parseFloat(s.milkQty) || 0), 0);
  const totalLbenSold = todaySales.reduce((sum, s) => sum + (parseFloat(s.lbenQty) || 0), 0);

  if (document.getElementById('stock-milk-sold')) document.getElementById('stock-milk-sold').textContent = totalMilkSold;
  if (document.getElementById('stock-lben-sold')) document.getElementById('stock-lben-sold').textContent = totalLbenSold;
  if (document.getElementById('stock-milk-remaining')) document.getElementById('stock-milk-remaining').textContent = (parseFloat(stock.milkOwned) || 0) - totalMilkSold;
  if (document.getElementById('stock-lben-remaining')) document.getElementById('stock-lben-remaining').textContent = (parseFloat(stock.lbenOwned) || 0) - totalLbenSold;

  const moneyTotal = todaySales.reduce((sum, s) => sum + (parseFloat(s.totalAmount) || 0), 0);
  const moneyPaid = todaySales.reduce((sum, s) => sum + (parseFloat(s.paidAmount) || 0), 0);
  const moneyLeft = Math.max(0, moneyTotal - moneyPaid);

  const moneyTotalEl = document.getElementById('money-total');
  const moneyPaidEl = document.getElementById('money-paid');
  const moneyLeftEl = document.getElementById('money-left');
  if (moneyTotalEl) moneyTotalEl.textContent = formatMoney(moneyTotal);
  if (moneyPaidEl) moneyPaidEl.textContent = formatMoney(moneyPaid);
  if (moneyLeftEl) moneyLeftEl.textContent = formatMoney(moneyLeft);
}

document.getElementById('save-stock-btn')?.addEventListener('click', () => {
  saveDailyStock(clampNonNegative(document.getElementById('stock-milk-owned').value), clampNonNegative(document.getElementById('stock-lben-owned').value), true);
  renderDailyStockUI();
});
document.getElementById('edit-stock-btn')?.addEventListener('click', () => {
  const stock = getDailyStock();
  saveDailyStock(stock.milkOwned, stock.lbenOwned, false);
  renderDailyStockUI();
});

// --- HISTORY SCREEN INTERFACE ---
function renderHistoryScreen() {
  const container = document.getElementById('history-container');
  if (!container) return;
  container.innerHTML = '';
  
  const sales = getSales();
  const allClients = getClients();

  // Debt summary
  const debtMap = {};
  sales.forEach(sale => { debtMap[sale.clientId] = (debtMap[sale.clientId] || 0) + ((parseFloat(sale.totalAmount) || 0) - (parseFloat(sale.paidAmount) || 0)); });
  const debtors = Object.keys(debtMap).filter(id => debtMap[id] > 0);

  const debtContainer = document.getElementById('debt-summary-container');
  if (debtContainer) {
    debtContainer.innerHTML = '';
    if (debtors.length > 0) {
      const card = document.createElement('div');
      card.className = 'card debt-summary-card';
      let html = `<h2 class="debt-summary-heading"><span>Total des dettes impayées</span><span>${formatMoney(debtors.reduce((sum, id) => sum + debtMap[id], 0))}</span></h2><ul class="client-list client-list--flush">`;
      debtors.forEach(id => {
        const client = allClients.find(c => c.id == id);
        html += `<li class="debt-list-item"><span class="client-name">${client ? escapeHtml(client.name) : 'Inconnu'}</span><span class="debt-amount">${formatMoney(debtMap[id])}</span></li>`;
      });
      card.innerHTML = html + `</ul>`;
      debtContainer.appendChild(card);
    }
  }

  if (sales.length === 0) {
    container.innerHTML = '<p class="empty-hint">Aucun historique de ventes disponible.</p>';
    return;
  }

  sales.sort((a, b) => new Date(b.date) - new Date(a.date));
  const tree = new Map();
  sales.forEach(sale => {
    const d = new Date(sale.date);
    const year = d.getFullYear().toString(), month = d.toLocaleString('fr-FR', { month: 'long' });
    const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
    const monday = new Date(d); monday.setDate(diff);
    const week = `Semaine du ${monday.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`;
    const day = d.toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' });

    if (!tree.has(year)) tree.set(year, new Map());
    if (!tree.get(year).has(month)) tree.get(year).set(month, new Map());
    if (!tree.get(year).get(month).has(week)) tree.get(year).get(month).set(week, new Map());
    if (!tree.get(year).get(month).get(week).has(day)) tree.get(year).get(month).get(week).set(day, []);
    tree.get(year).get(month).get(week).get(day).push(sale);
  });

  let openPath = true;
  for (const [year, months] of tree.entries()) {
    const yearDetails = document.createElement('details'); yearDetails.className = 'tree-details'; if (openPath) yearDetails.open = true;
    yearDetails.innerHTML = `<summary class="tree-summary">${year}</summary>`;
    for (const [month, weeks] of months.entries()) {
      const monthDetails = document.createElement('details'); monthDetails.className = 'tree-details tree-details--nested'; if (openPath) monthDetails.open = true;
      monthDetails.innerHTML = `<summary class="tree-summary">${month}</summary>`;
      for (const [week, days] of weeks.entries()) {
        const weekDetails = document.createElement('details'); weekDetails.className = 'tree-details tree-details--nested'; if (openPath) weekDetails.open = true;
        weekDetails.innerHTML = `<summary class="tree-summary">${week}</summary>`;
        for (const [day, daySales] of days.entries()) {
          const dayDetails = document.createElement('details'); dayDetails.className = 'tree-details tree-details--nested tree-details--leaf'; if (openPath) dayDetails.open = true;
          dayDetails.innerHTML = `<summary class="tree-summary">${day}</summary>`;
          
          const salesList = document.createElement('div'); salesList.className = 'sales-list';
          daySales.forEach(sale => {
            const isFullyPaid = sale.paidAmount >= sale.totalAmount;
            const clientName = allClients.find(c => c.id === sale.clientId)?.name || 'Inconnu';
            salesList.innerHTML += `
              <div class="card history-sale-card ${isFullyPaid ? 'is-paid' : 'is-unpaid'}">
                <div class="sale-card-row">
                  <strong class="sale-card-name">${escapeHtml(clientName)}</strong>
                  <span class="sale-card-total">${formatMoney(sale.totalAmount)}</span>
                </div>
                <div class="sale-card-meta">
                  <span>Lait : <strong>${sale.milkQty}</strong> | Lben : <strong>${sale.lbenQty}</strong></span>
                  <span class="sale-card-status ${isFullyPaid ? 'is-paid' : 'is-unpaid'}">${isFullyPaid ? 'Payé intégralement' : `Payé : ${formatMoney(sale.paidAmount)}`}</span>
                </div>
              </div>`;
          });
          dayDetails.appendChild(salesList); weekDetails.appendChild(dayDetails); openPath = false;
        }
        monthDetails.appendChild(weekDetails);
      }
      yearDetails.appendChild(monthDetails);
    }
    container.appendChild(yearDetails);
  }
}

// --- BACKUP & RESTORE ---
document.getElementById('export-data-btn')?.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), prices: getPrices(), clients: getClients(), sales: getSales(), dailyStock: getDailyStockArray(), groups: getGroups() }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url; link.download = `milk-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
});

document.getElementById('import-data-input')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const data = safeParse(reader.result, null);
    if (!data || !Array.isArray(data.clients) || !Array.isArray(data.sales)) {
      alert("Ce fichier ne semble pas être une sauvegarde de Milk Manager."); return;
    }
    if (!confirm('Cela remplacera tous les clients, ventes, prix et stock actuels. Continuer ?')) return;
    
    if (data.prices) localStorage.setItem('milk_app_prices', JSON.stringify(data.prices));
    localStorage.setItem('milk_app_clients', JSON.stringify(data.clients));
    localStorage.setItem('milk_app_sales', JSON.stringify(data.sales));
    if (data.dailyStock) localStorage.setItem('milk_app_daily_stock', JSON.stringify(data.dailyStock));
    if (data.groups) saveGroups(data.groups);

    loadPricesUI(); renderManageClients(); renderDailyClients(); renderHistoryScreen(); renderDailyStockUI(); renderGroupsUI(); populateClientGroupDropdown();
    alert('Sauvegarde restaurée avec succès.');
  };
  reader.readAsText(file);
});





// Init
renderManageClients();
renderDailyClients();
renderHistoryScreen();
renderDailyStockUI();
renderGroupsUI();
populateClientGroupDropdown();
