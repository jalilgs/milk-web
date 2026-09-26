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

// --- PRICES & STORAGE ---
const DEFAULT_PRICES = { milk: 345, lben: 1200, isLocked: false };

function getPrices() {
  const saved = localStorage.getItem('milk_app_prices');
  return saved ? JSON.parse(saved) : DEFAULT_PRICES;
}

function loadPricesUI() {
  const prices = getPrices();
  const milkInput = document.getElementById('milk-price');
  const lbenInput = document.getElementById('lben-price');
  const saveBtn = document.getElementById('save-prices-btn');
  const editBtn = document.getElementById('edit-prices-btn');

  if (milkInput) milkInput.value = prices.milk;
  if (lbenInput) lbenInput.value = prices.lben;

  if (prices.isLocked) {
    if (milkInput) { milkInput.disabled = true; milkInput.style.background = '#f0f0f0'; }
    if (lbenInput) { lbenInput.disabled = true; lbenInput.style.background = '#f0f0f0'; }
    if (saveBtn) saveBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'block';
  } else {
    if (milkInput) { milkInput.disabled = false; milkInput.style.background = 'white'; }
    if (lbenInput) { lbenInput.disabled = false; lbenInput.style.background = 'white'; }
    if (saveBtn) saveBtn.style.display = 'block';
    if (editBtn) editBtn.style.display = 'none';
  }
}

const savePricesBtn = document.getElementById('save-prices-btn');
const editPricesBtn = document.getElementById('edit-prices-btn');
const priceStatus = document.getElementById('price-status');

if (savePricesBtn) {
  savePricesBtn.addEventListener('click', () => {
    const milkVal = parseFloat(document.getElementById('milk-price').value) || 0;
    const lbenVal = parseFloat(document.getElementById('lben-price').value) || 0;

    const updatedPrices = { milk: milkVal, lben: lbenVal, isLocked: true };
    localStorage.setItem('milk_app_prices', JSON.stringify(updatedPrices));

    loadPricesUI();
    if (priceStatus) {
      priceStatus.textContent = "Prices saved & locked successfully!";
      setTimeout(() => { priceStatus.textContent = ""; }, 2500);
    }
  });
}

if (editPricesBtn) {
  editPricesBtn.addEventListener('click', () => {
    const prices = getPrices();
    prices.isLocked = false;
    localStorage.setItem('milk_app_prices', JSON.stringify(prices));
    
    loadPricesUI();
    if (priceStatus) {
      priceStatus.textContent = "Prices unlocked for editing.";
      setTimeout(() => { priceStatus.textContent = ""; }, 2500);
    }
  });
}

loadPricesUI();

// --- CLIENT MANAGEMENT ---
function getClients() {
  const saved = localStorage.getItem('milk_app_clients');
  return saved ? JSON.parse(saved) : [];
}

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
    listEl.innerHTML = '<p style="color:gray; font-size: 14px; text-align: center;">No clients added yet.</p>';
    return;
  }

  activeClients.forEach(client => {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'client-name';
    nameSpan.textContent = client.name;

    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'delete-btn';
    archiveBtn.textContent = 'Archive';
    
    archiveBtn.onclick = () => {
      if (confirm(`Archive ${client.name}? Their past sales history will remain safe.`)) {
        archiveClient(client.id);
      }
    };

    li.appendChild(nameSpan);
    li.appendChild(archiveBtn);
    listEl.appendChild(li);
  });

  if (archivedClients.length > 0) {
    const details = document.createElement('details');
    details.style.cssText = 'margin-top: 16px; border-top: 1px solid #ddd; padding-top: 8px;';

    const summary = document.createElement('summary');
    summary.style.cssText = 'font-weight: bold; color: #666; cursor: pointer; padding: 8px 0; font-size: 14px;';
    summary.textContent = `Archived Clients (${archivedClients.length})`;
    details.appendChild(summary);

    const archivedUl = document.createElement('ul');
    archivedUl.className = 'client-list';

    archivedClients.forEach(client => {
      const li = document.createElement('li');
      li.style.opacity = '0.6';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'client-name';
      nameSpan.textContent = client.name;

      const restoreBtn = document.createElement('button');
      restoreBtn.className = 'secondary-btn';
      restoreBtn.style.cssText = 'padding: 4px 8px; font-size: 12px; flex: 0;';
      restoreBtn.textContent = 'Restore';
      
      restoreBtn.onclick = () => {
        restoreClient(client.id);
      };

      li.appendChild(nameSpan);
      li.appendChild(restoreBtn);
      archivedUl.appendChild(li);
    });

    details.appendChild(archivedUl);
    listEl.appendChild(details);
  }
}

function archiveClient(id) {
  const clients = getClients();
  const client = clients.find(c => c.id === id);
  if (client) {
    client.isActive = false;
    saveClients(clients);
  }
}

function restoreClient(id) {
  const clients = getClients();
  const client = clients.find(c => c.id === id);
  if (client) {
    client.isActive = true;
    saveClients(clients);
  }
}

const addClientBtn = document.getElementById('add-client-btn');
const newClientInput = document.getElementById('new-client-name');

if (addClientBtn) {
  addClientBtn.addEventListener('click', () => {
    const name = newClientInput.value.trim();
    if (!name) return;

    const clients = getClients();
    const newClient = {
      id: Date.now(),
      name: name,
      isActive: true
    };

    clients.push(newClient);
    saveClients(clients);
    newClientInput.value = '';
  });
}

// --- DAILY SALES INTERFACE ---
let currentSelectedClientId = null;
let currentSaleId = null;

const saleModal = document.getElementById('sale-modal');
const milkQtyInput = document.getElementById('sale-milk-qty');
const lbenQtyInput = document.getElementById('sale-lben-qty');
const totalPriceLabel = document.getElementById('sale-total-price');
const paidAmountInput = document.getElementById('sale-paid-amount');
const tomorrowQtyInput = document.getElementById('sale-tomorrow-qty');
const remainingFundsInput = document.getElementById('sale-remaining-funds');
const remainingMoneyLabel = document.getElementById('sale-remaining-money');
const fullPayBtn = document.getElementById('full-pay-btn');

function isToday(dateString) {
  const d = new Date(dateString);
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

function renderDailyClients() {
  const clients = getClients().filter(c => c.isActive !== false);
  const gridEl = document.getElementById('daily-clients-grid');
  if (!gridEl) return;
  gridEl.innerHTML = '';

  const savedSales = localStorage.getItem('milk_app_sales');
  const salesArray = savedSales ? JSON.parse(savedSales) : [];
  
  const todaySales = salesArray.filter(s => isToday(s.date));

  const clientData = clients.map(client => {
    const cSales = todaySales.filter(s => s.clientId === client.id);
    
    if (cSales.length > 0) {
      cSales.sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstSaleTime = new Date(cSales[0].date).getTime();
      
      const totalMilk = cSales.reduce((sum, s) => sum + (parseFloat(s.milkQty) || 0), 0);
      const totalLben = cSales.reduce((sum, s) => sum + (parseFloat(s.lbenQty) || 0), 0);
      const totalAmount = cSales.reduce((sum, s) => sum + (parseFloat(s.totalAmount) || 0), 0);
      const totalPaid = cSales.reduce((sum, s) => sum + (parseFloat(s.paidAmount) || 0), 0);
      
      return {
        ...client,
        hasSale: true,
        firstSaleTime,
        totalMilk,
        totalLben,
        totalAmount,
        totalPaid
      };
    }

    return {
      ...client,
      hasSale: false,
      firstSaleTime: Infinity,
      totalMilk: 0,
      totalLben: 0,
      totalAmount: 0
    };
  });

  clientData.sort((a, b) => {
    if (a.hasSale && !b.hasSale) return -1;
    if (!a.hasSale && b.hasSale) return 1;
    if (a.hasSale && b.hasSale) return a.firstSaleTime - b.firstSaleTime;
    return 0;
  });

  clientData.forEach(client => {
    const card = document.createElement('div');
    
    if (client.hasSale) {
      const isFullyPaid = client.totalPaid >= client.totalAmount;
      const statusClass = isFullyPaid ? 'paid' : 'unpaid';
      const remainingAmount = client.totalAmount - client.totalPaid;
      
      card.className = `client-card has-sale ${statusClass}`;
      card.innerHTML = `
        <div class="client-card-info">
          <span class="client-name">${client.name}</span>
          <span class="client-sale-summary ${statusClass}-text">
            Milk: <strong>${client.totalMilk}</strong> | Lben: <strong>${client.totalLben}</strong>
          </span>
        </div>
        <div style="text-align: right;">
          <span style="color: ${isFullyPaid ? '#2e7d32' : '#c62828'}; font-weight: bold; font-size: 16px;">${client.totalAmount} DA</span>
          <div style="font-size: 11px; color: ${isFullyPaid ? '#2e7d32' : '#c62828'}; margin-top: 2px;">
            ${isFullyPaid ? 'Fully Paid &rarr;' : `Unpaid: ${remainingAmount} DA &rarr;`}
          </div>
        </div>
      `;
    } else {
      card.className = 'client-card';
      card.innerHTML = `
        <span>${client.name}</span>
        <span style="color: gray; font-size: 14px;">Tap to add &rarr;</span>
      `;
    }
    
    // FIX 2: Pass both client.id and client.name
    card.onclick = () => openSaleModal(client.id, client.name);
    gridEl.appendChild(card);
  });
}

function updateCalculations() {
  const prices = getPrices();
  const mQty = parseFloat(milkQtyInput.value) || 0;
  const lQty = parseFloat(lbenQtyInput.value) || 0;
  
  const total = (mQty * prices.milk) + (lQty * prices.lben);
  if (totalPriceLabel) totalPriceLabel.textContent = `${total} DA`;

  const paid = parseFloat(paidAmountInput.value) || 0;
  const remainingMoney = Math.max(0, total - paid);
  if (remainingMoneyLabel) remainingMoneyLabel.textContent = `${remainingMoney} DA`;
}

// Open modal and load existing today's data or carry-forward values
function openSaleModal(clientId, clientName) {
  // FIX 1 & 3: Set correct global variables
  currentSelectedClientId = clientId;

  const titleEl = document.getElementById('modal-client-name');
  if (titleEl) titleEl.textContent = clientName;

  const savedSales = localStorage.getItem('milk_app_sales');
  const salesArray = savedSales ? JSON.parse(savedSales) : [];
  
  const todaySale = salesArray.find(s => s.clientId === clientId && isToday(s.date));
  const pastSales = salesArray.filter(s => s.clientId === clientId).sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastSale = pastSales.length > 0 ? pastSales[0] : null;

  // Track existing sale ID if editing
  currentSaleId = todaySale ? todaySale.id : null;

  milkQtyInput.value = todaySale ? todaySale.milkQty : '';
  lbenQtyInput.value = todaySale ? todaySale.lbenQty : '';
  paidAmountInput.value = todaySale ? todaySale.paidAmount : '';
  
  remainingFundsInput.value = todaySale ? (todaySale.remainingFunds || '') : (lastSale ? (lastSale.remainingFunds || '') : '');
  tomorrowQtyInput.value = todaySale ? (todaySale.tomorrowQty || '') : (lastSale ? (lastSale.tomorrowQty || '') : '');

  updateCalculations();
  saleModal.classList.add('active');
}

// Event Listeners for Live Modal Calculation
if (milkQtyInput) milkQtyInput.addEventListener('input', updateCalculations);
if (lbenQtyInput) lbenQtyInput.addEventListener('input', updateCalculations);
if (paidAmountInput) paidAmountInput.addEventListener('input', updateCalculations);

if (fullPayBtn) {
  fullPayBtn.addEventListener('click', () => {
    const prices = getPrices();
    const mQty = parseFloat(milkQtyInput.value) || 0;
    const lQty = parseFloat(lbenQtyInput.value) || 0;
    const total = (mQty * prices.milk) + (lQty * prices.lben);
    
    paidAmountInput.value = total;
    updateCalculations();
  });
}

const cancelBtn = document.getElementById('cancel-sale-btn');
if (cancelBtn) {
  cancelBtn.addEventListener('click', () => {
    saleModal.classList.remove('active');
    currentSelectedClientId = null;
    currentSaleId = null;
  });
}

function handleQtyBtn(inputEl, increment) {
  let val = parseInt(inputEl.value) || 0;
  val += increment;
  if (val < 0) val = 0;
  inputEl.value = val;
  updateCalculations();
}

const milkMinus = document.getElementById('milk-minus');
const milkPlus = document.getElementById('milk-plus');
const lbenMinus = document.getElementById('lben-minus');
const lbenPlus = document.getElementById('lben-plus');


const fundsMinus = document.getElementById('funds-minus');
const fundsPlus = document.getElementById('funds-plus');
const tomorrowMinus = document.getElementById('tomorrow-minus');
const tomorrowPlus = document.getElementById('tomorrow-plus');

if (milkMinus) milkMinus.addEventListener('click', () => handleQtyBtn(milkQtyInput, -1));
if (milkPlus) milkPlus.addEventListener('click', () => handleQtyBtn(milkQtyInput, 1));
if (lbenMinus) lbenMinus.addEventListener('click', () => handleQtyBtn(lbenQtyInput, -1));
if (lbenPlus) lbenPlus.addEventListener('click', () => handleQtyBtn(lbenQtyInput, 1));

if (fundsMinus) fundsMinus.addEventListener('click', () => handleQtyBtn(remainingFundsInput, -1));
if (fundsPlus) fundsPlus.addEventListener('click', () => handleQtyBtn(remainingFundsInput, 1));
if (tomorrowMinus) tomorrowMinus.addEventListener('click', () => handleQtyBtn(tomorrowQtyInput, -1));
if (tomorrowPlus) tomorrowPlus.addEventListener('click', () => handleQtyBtn(tomorrowQtyInput, 1));

// Save Sale Transaction
const saveSaleBtn = document.getElementById('save-sale-btn');
if (saveSaleBtn) {
  saveSaleBtn.addEventListener('click', () => {
    if (!currentSelectedClientId) return;

    const prices = getPrices();
    const mQty = parseFloat(milkQtyInput.value) || 0;
    const lQty = parseFloat(lbenQtyInput.value) || 0;
    const totalAmount = (mQty * prices.milk) + (lQty * prices.lben);
    const paidAmount = parseFloat(paidAmountInput.value) || 0;
    const tomorrowQty = parseFloat(tomorrowQtyInput.value) || 0;
    const remFunds = parseFloat(remainingFundsInput.value) || 0;

    const savedSales = localStorage.getItem('milk_app_sales');
    let salesArray = savedSales ? JSON.parse(savedSales) : [];

    if (currentSaleId) {
      // UPDATE EXISTING SALE
      const saleIndex = salesArray.findIndex(s => s.id === currentSaleId);
      if (saleIndex > -1) {
        salesArray[saleIndex].milkQty = mQty;
        salesArray[saleIndex].lbenQty = lQty;
        salesArray[saleIndex].totalAmount = totalAmount;
        salesArray[saleIndex].paidAmount = paidAmount;
        salesArray[saleIndex].tomorrowQty = tomorrowQty;
        salesArray[saleIndex].remainingFunds = remFunds;
      }
    } else {
      // CREATE NEW SALE
      const newSale = {
        id: Date.now(),
        clientId: currentSelectedClientId,
        date: new Date().toISOString(), 
        milkQty: mQty,
        lbenQty: lQty,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        tomorrowQty: tomorrowQty,
        remainingFunds: remFunds
      };
      salesArray.push(newSale);
    }

    localStorage.setItem('milk_app_sales', JSON.stringify(salesArray));

    renderDailyClients();
    renderHistoryScreen();
    renderDailyStockUI();

    saleModal.classList.remove('active');
    currentSelectedClientId = null;
    currentSaleId = null;
  });
}

// --- HISTORY SCREEN INTERFACE ---
function buildHistoryTree(sales) {
  sales.sort((a, b) => new Date(b.date) - new Date(a.date));
  const tree = new Map();
  
  sales.forEach(sale => {
    const d = new Date(sale.date);
    const year = d.getFullYear().toString();
    const month = d.toLocaleString('default', { month: 'long' });
    
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const week = `Week of ${monday.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;
    const day = d.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' });
    
    if (!tree.has(year)) tree.set(year, new Map());
    if (!tree.get(year).has(month)) tree.get(year).set(month, new Map());
    if (!tree.get(year).get(month).has(week)) tree.get(year).get(month).set(week, new Map());
    if (!tree.get(year).get(month).get(week).has(day)) tree.get(year).get(month).get(week).set(day, []);
    
    tree.get(year).get(month).get(week).get(day).push(sale);
  });
  
  return tree;
}

function createDetailsNode(title, isOpen, extraStyle = '') {
  const details = document.createElement('details');
  if (isOpen) details.open = true;
  details.style.cssText = `margin-top: 8px; border: 1px solid #ddd; border-radius: 6px; padding: 6px; background: #fafafa; ${extraStyle}`;
  
  const summary = document.createElement('summary');
  summary.style.cssText = 'font-weight: 600; cursor: pointer; padding: 4px; font-size: 15px; color: #333; user-select: none;';
  summary.textContent = title;
  
  details.appendChild(summary);
  return details;
}

function renderDebtSummary(sales) {
  const container = document.getElementById('debt-summary-container');
  if (!container) return;
  container.innerHTML = '';

  const allClients = getClients();
  const debtMap = {};

  sales.forEach(sale => {
    const debt = (parseFloat(sale.totalAmount) || 0) - (parseFloat(sale.paidAmount) || 0);
    debtMap[sale.clientId] = (debtMap[sale.clientId] || 0) + debt;
  });

  const debtors = Object.keys(debtMap).filter(id => debtMap[id] > 0);

  if (debtors.length > 0) {
    const totalNetworkDebt = debtors.reduce((sum, id) => sum + debtMap[id], 0);
    
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'background: var(--danger-bg); border-color: var(--danger-border); margin-bottom: 24px;';

    let html = `<h2 style="color: var(--danger-text); font-size: 16px; margin-bottom: 12px; display: flex; justify-content: space-between;">
                  <span>Total Unpaid Debts</span>
                  <span>${totalNetworkDebt} DA</span>
                </h2>
                <ul class="client-list" style="margin-top:0;">`;

    debtors.forEach(id => {
      const client = allClients.find(c => c.id == id);
      const name = client ? client.name : 'Unknown Client';
      html += `<li style="border-bottom-color: var(--danger-border); padding: 8px 0;">
        <span class="client-name" style="color: var(--text-dark);">${name}</span>
        <span style="color: var(--danger-text); font-weight: bold;">${debtMap[id]} DA</span>
      </li>`;
    });
    
    html += `</ul>`;
    card.innerHTML = html;
    container.appendChild(card);
  }
}

function renderHistoryScreen() {
  const container = document.getElementById('history-container');
  if (!container) return;
  container.innerHTML = '';
  
  const savedSales = localStorage.getItem('milk_app_sales');
  const sales = savedSales ? JSON.parse(savedSales) : [];
  
  renderDebtSummary(sales);

  if (sales.length === 0) {
    container.innerHTML = '<p style="color:gray; text-align: center; margin-top: 20px;">No sales history available.</p>';
    return;
  }
  
  const allClients = getClients();
  const getClientName = (id) => {
    const c = allClients.find(c => c.id === id);
    return c ? c.name : 'Unknown Client';
  };
  
  const tree = buildHistoryTree(sales);
  let openPath = true;
  
  for (const [year, months] of tree.entries()) {
    const yearDetails = createDetailsNode(year, openPath);
    
    for (const [month, weeks] of months.entries()) {
      const monthDetails = createDetailsNode(month, openPath, 'margin-left: 12px;');
      
      for (const [week, days] of weeks.entries()) {
        const weekDetails = createDetailsNode(week, openPath, 'margin-left: 12px;');
        
        for (const [day, daySales] of days.entries()) {
          const dayDetails = createDetailsNode(day, openPath, 'margin-left: 12px; background: white;');
          
          const salesList = document.createElement('div');
          salesList.style.cssText = 'margin-top: 8px; display: flex; flex-direction: column; gap: 8px;';
          
          daySales.forEach(sale => {
            const isFullyPaid = sale.paidAmount >= sale.totalAmount;
            const card = document.createElement('div');
            card.className = 'card';
            card.style.cssText = 'margin-bottom: 0; padding: 12px; border-left: 4px solid ' + (isFullyPaid ? '#4caf50' : '#f44336') + ';';
            
            card.innerHTML = `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <strong style="font-size: 16px;">${getClientName(sale.clientId)}</strong>
                <span style="font-weight: bold; font-size: 16px;">${sale.totalAmount} DA</span>
              </div>
              <div style="font-size: 13px; color: #555; display: flex; justify-content: space-between;">
                <span>Milk: <strong>${sale.milkQty}</strong> | Lben: <strong>${sale.lbenQty}</strong></span>
                <span style="color: ${isFullyPaid ? '#2e7d32' : '#c62828'}; font-weight: 500;">
                  ${isFullyPaid ? 'Fully Paid' : `Paid: ${sale.paidAmount} DA`}
                </span>
              </div>
            `;
            salesList.appendChild(card);
          });
          
          dayDetails.appendChild(salesList);
          weekDetails.appendChild(dayDetails);
          openPath = false;
        }
        monthDetails.appendChild(weekDetails);
      }
      yearDetails.appendChild(monthDetails);
    }
    container.appendChild(yearDetails);
  }
}

// --- DAILY STOCK LOGIC ---
function getDailyStock() {
  const saved = localStorage.getItem('milk_app_daily_stock');
  const stockArray = saved ? JSON.parse(saved) : [];
  const todayEntry = stockArray.find(s => isToday(s.date));

  if (todayEntry) return todayEntry;

  if (stockArray.length > 0) {
    const pastStock = [...stockArray].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastEntry = pastStock[0];

    const savedSales = localStorage.getItem('milk_app_sales');
    const salesArray = savedSales ? JSON.parse(savedSales) : [];
    const lastDaySales = salesArray.filter(s => new Date(s.date).toDateString() === new Date(lastEntry.date).toDateString());

    const lastMilkSold = lastDaySales.reduce((sum, s) => sum + (parseFloat(s.milkQty) || 0), 0);
    const lastLbenSold = lastDaySales.reduce((sum, s) => sum + (parseFloat(s.lbenQty) || 0), 0);

    const carriedMilk = Math.max(0, (parseFloat(lastEntry.milkOwned) || 0) - lastMilkSold);
    const carriedLben = Math.max(0, (parseFloat(lastEntry.lbenOwned) || 0) - lastLbenSold);

    return { date: new Date().toISOString(), milkOwned: carriedMilk, lbenOwned: carriedLben, isLocked: false };
  }

  return { date: new Date().toISOString(), milkOwned: 0, lbenOwned: 0, isLocked: false };
}

function saveDailyStock(milkOwned, lbenOwned, isLocked) {
  const saved = localStorage.getItem('milk_app_daily_stock');
  let stockArray = saved ? JSON.parse(saved) : [];
  
  const index = stockArray.findIndex(s => isToday(s.date));
  if (index > -1) {
    stockArray[index].milkOwned = milkOwned;
    stockArray[index].lbenOwned = lbenOwned;
    stockArray[index].isLocked = isLocked;
  } else {
    stockArray.push({
      id: Date.now(),
      date: new Date().toISOString(),
      milkOwned: milkOwned,
      lbenOwned: lbenOwned,
      isLocked: isLocked
    });
  }

  localStorage.setItem('milk_app_daily_stock', JSON.stringify(stockArray));
}

function renderDailyStockUI() {
  const stock = getDailyStock();
  
  const milkInput = document.getElementById('stock-milk-owned');
  const lbenInput = document.getElementById('stock-lben-owned');
  const saveBtn = document.getElementById('save-stock-btn');
  const editBtn = document.getElementById('edit-stock-btn');
  
  if (milkInput && document.activeElement !== milkInput) milkInput.value = stock.milkOwned || '';
  if (lbenInput && document.activeElement !== lbenInput) lbenInput.value = stock.lbenOwned || '';

  if (stock.isLocked) {
    if (milkInput) { milkInput.disabled = true; milkInput.style.background = '#f0f0f0'; }
    if (lbenInput) { lbenInput.disabled = true; lbenInput.style.background = '#f0f0f0'; }
    if (saveBtn) saveBtn.style.display = 'none';
    if (editBtn) editBtn.style.display = 'block';
  } else {
    if (milkInput) { milkInput.disabled = false; milkInput.style.background = 'white'; }
    if (lbenInput) { lbenInput.disabled = false; lbenInput.style.background = 'white'; }
    if (saveBtn) saveBtn.style.display = 'block';
    if (editBtn) editBtn.style.display = 'none';
  }

  const savedSales = localStorage.getItem('milk_app_sales');
  const salesArray = savedSales ? JSON.parse(savedSales) : [];
  const todaySales = salesArray.filter(s => isToday(s.date));

  const totalMilkSold = todaySales.reduce((sum, s) => sum + (parseFloat(s.milkQty) || 0), 0);
  const totalLbenSold = todaySales.reduce((sum, s) => sum + (parseFloat(s.lbenQty) || 0), 0);

  const remainingMilk = (parseFloat(stock.milkOwned) || 0) - totalMilkSold;
  const remainingLben = (parseFloat(stock.lbenOwned) || 0) - totalLbenSold;

  const milkSoldEl = document.getElementById('stock-milk-sold');
  const lbenSoldEl = document.getElementById('stock-lben-sold');
  const milkRemEl = document.getElementById('stock-milk-remaining');
  const lbenRemEl = document.getElementById('stock-lben-remaining');

  if (milkSoldEl) milkSoldEl.textContent = totalMilkSold;
  if (lbenSoldEl) lbenSoldEl.textContent = totalLbenSold;
  if (milkRemEl) milkRemEl.textContent = remainingMilk;
  if (lbenRemEl) lbenRemEl.textContent = remainingLben;
}

const saveStockBtn = document.getElementById('save-stock-btn');
const editStockBtn = document.getElementById('edit-stock-btn');

if (saveStockBtn) {
  saveStockBtn.addEventListener('click', () => {
    const milkVal = parseFloat(document.getElementById('stock-milk-owned').value) || 0;
    const lbenVal = parseFloat(document.getElementById('stock-lben-owned').value) || 0;
    saveDailyStock(milkVal, lbenVal, true);
    renderDailyStockUI();
  });
}

if (editStockBtn) {
  editStockBtn.addEventListener('click', () => {
    const stock = getDailyStock();
    saveDailyStock(stock.milkOwned, stock.lbenOwned, false);
    renderDailyStockUI();
  });
}

// Initial Screen Renders
renderManageClients();
renderDailyClients();
renderHistoryScreen();
renderDailyStockUI();
