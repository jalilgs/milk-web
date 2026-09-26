// --- TAB NAVIGATION ---
const buttons = document.querySelectorAll('.tab-button');
const screens = document.querySelectorAll('.screen');

// ===== TEMPORARY TOMORROW MODE =====
(() => {
    const RealDate = Date;

    class FakeDate extends RealDate {
        constructor(...args) {
            if (args.length === 0) {
                super(RealDate.now() + 86400000);
            } else {
                super(...args);
            }
        }

        static now() {
            return RealDate.now() + 86400000;
        }
    }

    FakeDate.parse = RealDate.parse;
    FakeDate.UTC = RealDate.UTC;

    globalThis.Date = FakeDate;

    console.log("Tomorrow mode enabled:", new Date().toString());
})();
// // ===== END TEMPORARY TOMORROW MODE =====

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

let clearPastCratesFlag = false;
let clearPastDebtFlag = false;
let lastSaleIdForCrates = null;

// --- DAILY SALES INTERFACE ---
let currentSelectedClientId = null;
let currentSaleId = null;

const saleModal = document.getElementById('sale-modal');
const milkQtyInput = document.getElementById('sale-milk-qty');
const lbenQtyInput = document.getElementById('sale-lben-qty');
const totalPriceLabel = document.getElementById('sale-total-price');
const paidAmountInput = document.getElementById('sale-paid-amount');
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

function isYesterday(dateString) {
  const d = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  return d.getDate() === yesterday.getDate() &&
         d.getMonth() === yesterday.getMonth() &&
         d.getFullYear() === yesterday.getFullYear();
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
  
// NEW LOGIC: Only load today's inputs if editing today's entry. DO NOT auto-fill fields with past data.
  remainingFundsInput.value = todaySale ? (todaySale.remainingFunds || '') : '';
  tomorrowMilkInput.value = todaySale ? (todaySale.tomorrowMilk || '') : '';
  tomorrowLbenInput.value = todaySale ? (todaySale.tomorrowLben || '') : '';

  // Reset clear flags every time the modal opens
  clearPastCratesFlag = false;
  clearPastDebtFlag = false;
  lastSaleIdForCrates = lastSale ? lastSale.id : null;

  // GENERATE REMINDER CLOUDS
  const remindersContainer = document.getElementById('modal-reminders');
  if (remindersContainer) {
    remindersContainer.innerHTML = ''; 

    if (lastSale && !todaySale) {
      // 1. Quantity Reminder
      if (isYesterday(lastSale.date)) {
        const tMilk = lastSale.tomorrowMilk || 0;
        const tLben = lastSale.tomorrowLben || 0;
        if (tMilk > 0 || tLben > 0) {
          const qtyCloud = document.createElement('div');
          qtyCloud.className = 'reminder-cloud blue-cloud';
          qtyCloud.innerHTML = `🛒 Planned: <strong>${tMilk} Milk</strong> | <strong>${tLben} Lben</strong>`;
          remindersContainer.appendChild(qtyCloud);
        }
      }

      // 2. Empty Crates (Fonds) Reminder 
      const remCrates = lastSale.remainingFunds || 0;
      if (remCrates > 0) {
        const crateCloud = document.createElement('div');
        crateCloud.className = 'reminder-cloud orange-cloud';
        crateCloud.innerHTML = `
          📦 Owes: <strong>${remCrates} Empties</strong>
          <button class="check-funds-btn" title="Mark empties as returned">✔</button>
        `;
        
        crateCloud.querySelector('.check-funds-btn').onclick = () => {
          clearPastCratesFlag = true; // Queue for saving
          crateCloud.style.background = '#e8e8e8';
          crateCloud.style.borderColor = '#ccc';
          crateCloud.style.color = '#555';
          crateCloud.innerHTML = `✅ Empties returning (Click Save)`;
        };
        remindersContainer.appendChild(crateCloud);
      }
    }

    // 3. Remaining Money (Debt) Reminder 
    const totalDebt = pastSales.reduce((sum, s) => {
      const sTotal = parseFloat(s.totalAmount) || 0;
      const sPaid = parseFloat(s.paidAmount) || 0;
      return sum + Math.max(0, sTotal - sPaid);
    }, 0);
    
    if (totalDebt > 0) {
      const debtCloud = document.createElement('div');
      debtCloud.className = 'reminder-cloud red-cloud';
      debtCloud.innerHTML = `
        💰 Debt: <strong>${totalDebt} DA</strong>
        <button class="check-funds-btn" title="Mark all past debt as paid">✔</button>
      `;
      
      debtCloud.querySelector('.check-funds-btn').onclick = () => {
        clearPastDebtFlag = true; // Queue for saving
        debtCloud.style.background = '#e8e8e8';
        debtCloud.style.borderColor = '#ccc';
        debtCloud.style.color = '#555';
        debtCloud.innerHTML = `✅ Debt paying (Click Save)`;
      };
      remindersContainer.appendChild(debtCloud);
    }
  }

    // 3. Remaining Money (Debt) Reminder 
    // Calculates total unpaid money from ALL past sales for this client
    const totalDebt = pastSales.reduce((sum, s) => {
      const sTotal = parseFloat(s.totalAmount) || 0;
      const sPaid = parseFloat(s.paidAmount) || 0;
      return sum + Math.max(0, sTotal - sPaid);
    }, 0);
    
    // Shows up even if there is a todaySale, so you always know their debt balance
    if (totalDebt > 0) {
      const debtCloud = document.createElement('div');
      debtCloud.className = 'reminder-cloud red-cloud';
      debtCloud.innerHTML = `
        💰 Debt: <strong>${totalDebt} DA</strong>
        <button class="check-funds-btn" title="Mark all past debt as paid">✔</button>
      `;
      
      debtCloud.querySelector('.check-funds-btn').onclick = () => {
        const savedSalesStr = localStorage.getItem('milk_app_sales');
        if (savedSalesStr) {
          let allSales = JSON.parse(savedSalesStr);
          // Mark all unpaid past sales for this client as fully paid
          allSales.forEach(s => {
            if (s.clientId === clientId) {
              const sTotal = parseFloat(s.totalAmount) || 0;
              const sPaid = parseFloat(s.paidAmount) || 0;
              if (sTotal > sPaid) {
                s.paidAmount = sTotal; // Settle the debt in the database
              }
            }
          });
          localStorage.setItem('milk_app_sales', JSON.stringify(allSales));
        }
        debtCloud.remove();
        renderDailyClients(); // Updates the client grid behind the modal instantly
        renderHistoryScreen(); // Updates the history lists
      };
      remindersContainer.appendChild(debtCloud);
    }
  

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

const tomorrowMilkInput = document.getElementById('sale-tomorrow-milk');
const tomorrowLbenInput = document.getElementById('sale-tomorrow-lben');

const tomorrowMilkMinus = document.getElementById('tomorrow-milk-minus');
const tomorrowMilkPlus = document.getElementById('tomorrow-milk-plus');
const tomorrowLbenMinus = document.getElementById('tomorrow-lben-minus');
const tomorrowLbenPlus = document.getElementById('tomorrow-lben-plus');

if (milkMinus) milkMinus.addEventListener('click', () => handleQtyBtn(milkQtyInput, -1));
if (milkPlus) milkPlus.addEventListener('click', () => handleQtyBtn(milkQtyInput, 1));
if (lbenMinus) lbenMinus.addEventListener('click', () => handleQtyBtn(lbenQtyInput, -1));
if (lbenPlus) lbenPlus.addEventListener('click', () => handleQtyBtn(lbenQtyInput, 1));

if (fundsMinus) fundsMinus.addEventListener('click', () => handleQtyBtn(remainingFundsInput, -1));
if (fundsPlus) fundsPlus.addEventListener('click', () => handleQtyBtn(remainingFundsInput, 1));

if (tomorrowMilkMinus) tomorrowMilkMinus.addEventListener('click', () => handleQtyBtn(tomorrowMilkInput, -1));
if (tomorrowMilkPlus) tomorrowMilkPlus.addEventListener('click', () => handleQtyBtn(tomorrowMilkInput, 1));
if (tomorrowLbenMinus) tomorrowLbenMinus.addEventListener('click', () => handleQtyBtn(tomorrowLbenInput, -1));
if (tomorrowLbenPlus) tomorrowLbenPlus.addEventListener('click', () => handleQtyBtn(tomorrowLbenInput, 1));

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
    const tomorrowMilk = parseInt(tomorrowMilkInput.value) || 0;
    const tomorrowLben = parseInt(tomorrowLbenInput.value) || 0;
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
        salesArray[saleIndex].tomorrowMilk = parseInt(tomorrowMilkInput.value) || 0;
        salesArray[saleIndex].tomorrowLben = parseInt(tomorrowLbenInput.value) || 0;
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
        tomorrowMilk: tomorrowMilk, 
        tomorrowLben: tomorrowLben,
        remainingFunds: remFunds
      };
      salesArray.push(newSale);
    }

    // Clear past empty crates if the checkmark was clicked
    if (clearPastCratesFlag && lastSaleIdForCrates) {
      const saleToUpdate = salesArray.find(s => s.id === lastSaleIdForCrates);
      if (saleToUpdate) {
        saleToUpdate.remainingFunds = 0;
      }
    }

    // Clear past money debt if the checkmark was clicked
    if (clearPastDebtFlag) {
      salesArray.forEach(s => {
        if (s.clientId === currentSelectedClientId) {
          const sTotal = parseFloat(s.totalAmount) || 0;
          const sPaid = parseFloat(s.paidAmount) || 0;
          if (sTotal > sPaid) {
            s.paidAmount = sTotal; // Settle the historical debt
          }
        }
      });
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
