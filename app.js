const buttons = document.querySelectorAll('.tab-button');
const screens = document.querySelectorAll('.screen');

const fullPayBtn = document.getElementById('full-pay-btn');
const remainingMoneyLabel = document.getElementById('sale-remaining-money');
const remainingFundsInput = document.getElementById('sale-remaining-funds');

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

const DEFAULT_PRICES = { milk: 50, lben: 60 };

// Read saved prices or return defaults
function getPrices() {
  const saved = localStorage.getItem('milk_app_prices');
  return saved ? JSON.parse(saved) : DEFAULT_PRICES;
}

// Populate input fields with current prices
function loadPricesUI() {
  const prices = getPrices();
  document.getElementById('milk-price').value = prices.milk;
  document.getElementById('lben-price').value = prices.lben;
}

// Save prices on button click
const savePricesBtn = document.getElementById('save-prices-btn');
const priceStatus = document.getElementById('price-status');

savePricesBtn.addEventListener('click', () => {
  const milkVal = parseFloat(document.getElementById('milk-price').value) || 0;
  const lbenVal = parseFloat(document.getElementById('lben-price').value) || 0;

  const updatedPrices = { milk: milkVal, lben: lbenVal };
  localStorage.setItem('milk_app_prices', JSON.stringify(updatedPrices));

  priceStatus.textContent = "Prices saved successfully!";
  setTimeout(() => { priceStatus.textContent = ""; }, 2500);
});

// Load saved prices when page starts
loadPricesUI();


// --- CLIENT MANAGEMENT ---

// Read clients from storage
function getClients() {
  const saved = localStorage.getItem('milk_app_clients');
  return saved ? JSON.parse(saved) : [];
}

// Save clients and instantly update the screen
function saveClients(clients) {
  localStorage.setItem('milk_app_clients', JSON.stringify(clients));
  renderManageClients(); 
  renderDailyClients();
}

function renderManageClients() {
  const allClients = getClients();
  const listEl = document.getElementById('manage-client-list');
  listEl.innerHTML = '';

  const activeClients = allClients.filter(c => c.isActive !== false);
  const archivedClients = allClients.filter(c => c.isActive === false);

  if (allClients.length === 0) {
    listEl.innerHTML = '<p style="color:gray; font-size: 14px; text-align: center;">No clients added yet.</p>';
    return;
  }

  // Render Active Clients
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

  // Render Collapsible Archived Clients Section
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

// Add New Client action
const addClientBtn = document.getElementById('add-client-btn');
const newClientInput = document.getElementById('new-client-name');

addClientBtn.addEventListener('click', () => {
  const name = newClientInput.value.trim();
  if (!name) return; // Prevent empty names

  const clients = getClients();
  const newClient = {
    id: Date.now(), // Creates a unique timestamp ID
    name: name,
    isActive: true
  };

  clients.push(newClient);
  saveClients(clients);
  newClientInput.value = ''; // Clear the input box
});

// --- DAILY SALES INTERFACE ---

let currentSelectedClientId = null;
let currentSaleId = null;

const saleModal = document.getElementById('sale-modal');
const modalClientName = document.getElementById('modal-client-name');
const milkQtyInput = document.getElementById('sale-milk-qty');
const lbenQtyInput = document.getElementById('sale-lben-qty');
const totalPriceLabel = document.getElementById('sale-total-price');
const paidAmountInput = document.getElementById('sale-paid-amount');
const tomorrowQtyInput = document.getElementById('sale-tomorrow-qty');


// Helper: Check if date string matches today
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
  gridEl.innerHTML = '';

  const savedSales = localStorage.getItem('milk_app_sales');
  const salesArray = savedSales ? JSON.parse(savedSales) : [];
  
  // Filter today's sales
  const todaySales = salesArray.filter(s => isToday(s.date));

  // Combine clients with today's aggregated sales
  const clientData = clients.map(client => {
    const cSales = todaySales.filter(s => s.clientId === client.id);
    
    if (cSales.length > 0) {
      // Find time of first sale today
      cSales.sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstSaleTime = new Date(cSales[0].date).getTime();
      
      const totalMilk = cSales.reduce((sum, s) => sum + (s.milkQty || 0), 0);
      const totalLben = cSales.reduce((sum, s) => sum + (s.lbenQty || 0), 0);
      const totalAmount = cSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const totalPaid = cSales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
      
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

  // Sort: Sold clients first (sorted by firstSaleTime), Unsold last
  clientData.sort((a, b) => {
    if (a.hasSale && !b.hasSale) return -1;
    if (!a.hasSale && b.hasSale) return 1;
    if (a.hasSale && b.hasSale) return a.firstSaleTime - b.firstSaleTime;
    return 0;
  });

// Render cards
  clientData.forEach(client => {
    const card = document.createElement('div');
    
    if (client.hasSale) {
      // Check if they paid everything they owe today
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
    
    card.onclick = () => openSaleModal(client);
    gridEl.appendChild(card);
  });
}

// Open modal and load existing today's data if available
function openSaleModal(client) {
  currentSelectedClientId = client.id;
  modalClientName.textContent = client.name;
  currentSaleId = null; // Reset by default

  // Check if there is already a sale for this client today
  const savedSales = localStorage.getItem('milk_app_sales');
  const salesArray = savedSales ? JSON.parse(savedSales) : [];
  const todaySale = salesArray.find(s => s.clientId === client.id && isToday(s.date));

if (todaySale) {
    currentSaleId = todaySale.id;
    milkQtyInput.value = todaySale.milkQty || '';
    lbenQtyInput.value = todaySale.lbenQty || '';
    paidAmountInput.value = todaySale.paidAmount || '';
    remainingFundsInput.value = todaySale.remainingFunds || '';
    tomorrowQtyInput.value = todaySale.tomorrowQty || '';
  } else {
    milkQtyInput.value = '';
    lbenQtyInput.value = '';
    paidAmountInput.value = '';
    remainingFundsInput.value = '';
    tomorrowQtyInput.value = '';
  }
  
  updateCalculations();
  saleModal.classList.add('active');
}

// Close Modal
document.getElementById('cancel-sale-btn').addEventListener('click', () => {
  saleModal.classList.remove('active');
  currentSelectedClientId = null;
});

// Auto-calculate Totals, Money, and Funds in real time
function updateCalculations() {
  const prices = getPrices();
  const mQty = parseFloat(milkQtyInput.value) || 0;
  const lQty = parseFloat(lbenQtyInput.value) || 0;
  
  // 1. Calculate Total Price
  const total = (mQty * prices.milk) + (lQty * prices.lben);
  totalPriceLabel.textContent = `${total} DA`;

  // 2. Calculate Remaining Money
  const paid = parseFloat(paidAmountInput.value) || 0;
  const remainingMoney = total - paid;
  remainingMoneyLabel.textContent = `${remainingMoney} DA`;


}

// Trigger calculation when typing in ANY of these 4 fields
milkQtyInput.addEventListener('input', updateCalculations);
lbenQtyInput.addEventListener('input', updateCalculations);
paidAmountInput.addEventListener('input', updateCalculations);

// "Full Payment" Button logic
fullPayBtn.addEventListener('click', () => {
  const prices = getPrices();
  const mQty = parseFloat(milkQtyInput.value) || 0;
  const lQty = parseFloat(lbenQtyInput.value) || 0;
  const total = (mQty * prices.milk) + (lQty * prices.lben);
  
  paidAmountInput.value = total;
  updateCalculations(); // Instantly update the remaining money to 0
});



// --- Quantity +/- Buttons Logic ---
function handleQtyBtn(inputEl, increment) {
  let val = parseInt(inputEl.value) || 0;
  val += increment;
  if (val < 0) val = 0; // Prevent negative numbers
  inputEl.value = val;
  updateCalculations(); // Instantly update totals
}

document.getElementById('milk-minus').addEventListener('click', () => handleQtyBtn(milkQtyInput, -1));
document.getElementById('milk-plus').addEventListener('click', () => handleQtyBtn(milkQtyInput, 1));
document.getElementById('lben-minus').addEventListener('click', () => handleQtyBtn(lbenQtyInput, -1));
document.getElementById('lben-plus').addEventListener('click', () => handleQtyBtn(lbenQtyInput, 1));


// Save or Update the Sale Transaction
document.getElementById('save-sale-btn').addEventListener('click', () => {
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
      // Note: We don't change the date, so it keeps its sorted position
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

  // Save sale array back to localStorage
  localStorage.setItem('milk_app_sales', JSON.stringify(salesArray));

  // Re-render main client grid instantly
  renderDailyClients();
  renderHistoryScreen(); // Update history screen as well

  // Close modal
  saleModal.classList.remove('active');
});

// --- HISTORY SCREEN INTERFACE ---

function buildHistoryTree(sales) {
  // Sort from newest to oldest
  sales.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const tree = new Map();
  
  sales.forEach(sale => {
    const d = new Date(sale.date);
    const year = d.getFullYear().toString();
    const month = d.toLocaleString('default', { month: 'long' });
    
    // Find the Monday of that week
    const dayOfWeek = d.getDay();
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    const week = `Week of ${monday.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;
    
    // Formatted Day
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

function renderHistoryScreen() {
  const container = document.getElementById('history-container');
  container.innerHTML = '';
  
  const savedSales = localStorage.getItem('milk_app_sales');
  const sales = savedSales ? JSON.parse(savedSales) : [];
  
  if (sales.length === 0) {
    container.innerHTML = '<p style="color:gray; text-align: center; margin-top: 20px;">No sales history available.</p>';
    return;
  }
  
  const allClients = getClients(); // Gets all clients, including archived ones
  const getClientName = (id) => {
    const c = allClients.find(c => c.id === id);
    return c ? c.name : 'Unknown Client';
  };
  
  const tree = buildHistoryTree(sales);
  
  let openPath = true; // This forces only the first (newest) path to stay open
  
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
          openPath = false; // Turn off auto-open immediately after the first day is built
        }
        monthDetails.appendChild(weekDetails);
      }
      yearDetails.appendChild(monthDetails);
    }
    container.appendChild(yearDetails);
  }
}

// Update the main screen grid whenever the page loads
renderManageClients();
renderDailyClients();
renderHistoryScreen(); // Also render the history screen on load
