let clients = JSON.parse(localStorage.getItem('clients')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let currentPage = 1;
let ordersPerPage = 10;

// Зареждаме клиентите и поръчките от localStorage при зареждане на страницата
document.addEventListener('DOMContentLoaded', () => {
  renderClients();
  renderOrders();
  populateClientSelect();
  updateStatistics();
  updatePagination();
});

// Функция за добавяне на нов клиент
function addClient() {
  const name = document.getElementById('clientName').value;
  const phone = document.getElementById('clientPhone').value;

  if (name && phone) {
    const newClient = { id: clients.length + 1, name, phone };
    clients.push(newClient);
    localStorage.setItem('clients', JSON.stringify(clients)); // Записваме в localStorage
    renderClients(); // Рендерираме новия списък с клиенти
    populateClientSelect(); // Обновяваме списъка за селектиране на клиент
    document.getElementById('clientName').value = ''; // Изчистваме полето за име
    document.getElementById('clientPhone').value = ''; // Изчистваме полето за телефон
  } else {
    alert('Моля, попълнете всички полета за клиента.');
  }
}

// Функция за рендиране на списъка с клиенти
function renderClients() {
  const clientSelect = document.getElementById('clientSelect');
  clientSelect.innerHTML = '<option value="">Изберете клиент</option>'; // изчистваме текущите опции

  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = client.name;
    clientSelect.appendChild(option);
  });
}

// Функция за добавяне на поръчка
function addOrder() {
  const clientSelect = document.getElementById('clientSelect');
  const orderDate = document.getElementById('orderDate').value;
  const orderQuantity = document.getElementById('orderQuantity').value;
  const productSelect = document.getElementById('productSelect');

  const clientId = parseInt(clientSelect.value);
  const client = clients.find(client => client.id === clientId);
  const product = productSelect.value;

  if (client && orderDate && orderQuantity) {
    const order = {
      id: orders.length + 1,
      clientId,
      product,
      quantity: orderQuantity,
      date: orderDate,
      status: new Date(orderDate) < new Date(new Date().setDate(new Date().getDate() - 40)) ? 'ПОЗВЪНИ' : 'ОК'
    };

    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders)); // Записваме поръчките в localStorage
    renderOrders(); // Рендерираме новата поръчка
    updateStatistics(); // Обновяваме статистиката
    updatePagination(); // Обновяваме пагинацията
  } else {
    alert('Моля, попълнете всички полета за поръчката.');
  }
}

// Функция за рендиране на поръчките и показване на количеството на поръчките
function renderOrders() {
  const tableBody = document.getElementById('clientsTable');
  tableBody.innerHTML = ''; // изчистваме текущото съдържание

  // Сортираме поръчките така, че първо да са червените, после новите
  orders.sort((a, b) => {
    if (a.status === 'ПОЗВЪНИ' && b.status !== 'ПОЗВЪНИ') return -1;
    if (a.status !== 'ПОЗВЪНИ' && b.status === 'ПОЗВЪНИ') return 1;
    return new Date(b.date) - new Date(a.date);
  });

  // Показваме само поръчките на текущата страница
  const start = (currentPage - 1) * ordersPerPage;
  const end = start + ordersPerPage;
  const ordersToDisplay = orders.slice(start, end);

  ordersToDisplay.forEach(order => {
    const client = clients.find(client => client.id === order.clientId);
    const row = document.createElement('tr');
    
    const lastOrderDate = new Date(order.date);
    const currentDate = new Date();
    const daysSinceOrder = Math.floor((currentDate - lastOrderDate) / (1000 * 60 * 60 * 24));

    // Оцветяване на реда в зависимост от състоянието
    if (daysSinceOrder > 40 && order.status === 'ПОЗВЪНИ') {
      row.classList.add('bg-red-200');
    } else {
      row.classList.add('bg-white');
    }

    row.innerHTML = `
      <td class="border-b p-2">${client.name}</td>
      <td class="border-b p-2">${client.phone}</td>
      <td class="border-b p-2">${order.product}</td>
      <td class="border-b p-2">${order.quantity}</td>
      <td class="border-b p-2">${formatDate(order.date)}</td>
      <td class="border-b p-2">
        <button onclick="toggleOrderStatus(${order.id})" class="bg-green-500 text-white p-2 rounded">${order.status}</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Форматираме датата в формат ДД-ММ-ГГГГ
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Функция за промяна на статус на поръчка
function toggleOrderStatus(orderId) {
  const order = orders.find(order => order.id === orderId);
  if (order) {
    // Промяна на статус от "ПОЗВЪНИ" на "ОК" или обратно
    order.status = (order.status === 'ПОЗВЪНИ') ? 'ОК' : 'ПОЗВЪНИ';

    // След промяна на статуса, рендерираме отново поръчките
    localStorage.setItem('orders', JSON.stringify(orders)); // Записваме промените в localStorage
    renderOrders(); // Рендерираме новия статус
    updateStatistics(); // Обновяваме статистиката
  }
}

// Функция за търсене на поръчки по клиент
function searchOrders() {
  const searchTerm = document.getElementById('searchClient').value.toLowerCase();
  const filteredOrders = orders.filter(order => {
    const client = clients.find(client => client.id === order.clientId);
    return client && client.name.toLowerCase().includes(searchTerm);
  });
  
  renderFilteredOrders(filteredOrders);
}

// Функция за рендиране на филтрираните поръчки
function renderFilteredOrders(filteredOrders) {
  const tableBody = document.getElementById('clientsTable');
  tableBody.innerHTML = '';

  filteredOrders.forEach(order => {
    const client = clients.find(client => client.id === order.clientId);
    const row = document.createElement('tr');
    
    const lastOrderDate = new Date(order.date);
    const currentDate = new Date();
    const daysSinceOrder = Math.floor((currentDate - lastOrderDate) / (1000 * 60 * 60 * 24));

    if (daysSinceOrder > 40 && order.status === 'ПОЗВЪНИ') {
      row.classList.add('bg-red-200');
    } else {
      row.classList.add('bg-white');
    }

    row.innerHTML = `
      <td class="border-b p-2">${client.name}</td>
      <td class="border-b p-2">${client.phone}</td>
      <td class="border-b p-2">${order.product}</td>
      <td class="border-b p-2">${order.quantity}</td>
      <td class="border-b p-2">${formatDate(order.date)}</td>
      <td class="border-b p-2">
        <button onclick="toggleOrderStatus(${order.id})" class="bg-green-500 text-white p-2 rounded">${order.status}</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Функция за обновяване на статистиката
function updateStatistics() {
  const statisticsContent = document.getElementById('statisticsContent');
  const stats = orders.reduce((acc, order) => {
    const client = clients.find(client => client.id === order.clientId);
    if (client) {
      if (!acc[client.name]) acc[client.name] = { totalOrders: 0, totalQuantity: 0 };
      acc[client.name].totalOrders += 1;
      acc[client.name].totalQuantity += parseInt(order.quantity);
    }
    return acc;
  }, {});

  statisticsContent.innerHTML = '';
  for (const clientName in stats) {
    const { totalOrders, totalQuantity } = stats[clientName];
    statisticsContent.innerHTML += `<tr><td class="border-b p-2">${clientName}</td><td class="border-b p-2">${totalOrders}</td><td class="border-b p-2">${totalQuantity}</td></tr>`;
  }
}

// Функция за изчистване на данни от localStorage
function clearLocalStorage() {
  localStorage.removeItem('clients');
  localStorage.removeItem('orders');
  clients = [];
  orders = [];
  renderClients();
  renderOrders();
  updateStatistics();
}

// Функция за обновяване на пагинацията
function updatePagination() {
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  let pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.classList.add('p-2', 'bg-blue-500', 'text-white', 'rounded', 'mx-1');
    pageButton.onclick = () => {
      currentPage = i;
      renderOrders();
    };
    pagination.appendChild(pageButton);
  }
}
