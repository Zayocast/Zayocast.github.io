function toggleStatus(orderId) {
    fetch('toggle_status.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `order_id=${orderId}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const row = document.querySelector(`tr[data-order-id="${orderId}"]`);
            const statusCell = row.querySelector('.status-cell');
            row.classList.remove('bg-red-200');
            row.classList.add('bg-white');
            statusCell.innerHTML = '<button class="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">ОК</button>';
        }
    })
    .catch(error => console.error('Грешка:', error));
}

function fetchOrders(sortOrder, searchTerm = '') {
    const page = new URLSearchParams(window.location.search).get('page') || 1;

    fetch('fetch_orders.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `page=${page}&search=${encodeURIComponent(searchTerm)}&sort=${sortOrder}`
    })
    .then(response => response.json())
    .then(orders => {
        const tbody = document.getElementById('orders-table');
        if (tbody) {
            tbody.innerHTML = '';
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.className = order.bg_class;
                row.dataset.orderId = order.id;
                row.innerHTML = `
                    <td class="p-3 border-b border-r text-center">${order.company_name}</td>
                    <td class="p-3 border-b border-r text-center">${order.phone}</td>
                    <td class="p-3 border-b border-r text-center">${order.product}</td>
                    <td class="p-3 border-b border-r text-center">${order.quantity}</td>
                    <td class="p-3 border-b border-r text-center">${order.returned_gallons}</td>
                    <td class="p-3 border-b border-r text-center">${order.order_date}</td>
                    <td class="p-3 border-b text-center">
                        <button ${order.status === 'ПОЗВЪНИ' ? `onclick="toggleStatus(${order.id})"` : ''} 
                                class="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">${order.status}</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    })
    .catch(error => console.error('Грешка при сортиране:', error));
}

function fetchStats(searchTerm = '') {
    fetch('fetch_stats.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `search=${encodeURIComponent(searchTerm)}`
    })
    .then(response => response.json())
    .then(stats => {
        const tbody = document.getElementById('stats-table-body');
        if (tbody) {
            tbody.innerHTML = '';
            stats.forEach(stat => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="p-3 border-b border-r text-center">${stat.company_name}</td>
                    <td class="p-3 border-b border-r text-center">${stat.order_count}</td>
                    <td class="p-3 border-b border-r text-center">${stat.total_quantity}</td>
                    <td class="p-3 border-b border-r text-center">${stat.coffee_quantity}</td>
                    <td class="p-3 border-b border-r text-center">${stat.water_quantity}</td>
                    <td class="p-3 border-b text-center">${stat.returned}</td>
                `;
                tbody.appendChild(row);
            });
        }
    })
    .catch(error => console.error('Грешка при обновяване на статистиката:', error));
}

// Debounce функция за забавяне на AJAX заявките
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function setupAutocomplete(inputId, suggestionsId, hiddenId = null) {
    const input = document.getElementById(inputId);
    const suggestions = document.getElementById(suggestionsId);
    const hiddenInput = hiddenId ? document.getElementById(hiddenId) : null;
    const isStatsPage = inputId === 'client-search-stats';

    // Debounce за търсенето
    const debouncedFetch = debounce((search) => {
        fetch('fetch_clients.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `search=${encodeURIComponent(search)}`
        })
        .then(response => response.json())
        .then(clients => {
            suggestions.innerHTML = '';
            if (clients.length > 0) {
                suggestions.classList.remove('hidden');
                clients.forEach(client => {
                    const li = document.createElement('li');
                    li.className = 'p-2 hover:bg-gray-200 cursor-pointer';
                    li.textContent = client.name;
                    li.dataset.id = client.id;
                    li.addEventListener('click', function() {
                        input.value = client.name;
                        if (hiddenInput) hiddenInput.value = client.id;
                        suggestions.classList.add('hidden');
                        if (isStatsPage) {
                            fetchStats(client.name);
                        } else {
                            fetchOrders(document.getElementById('sort-date').dataset.sort, client.name);
                        }
                    });
                    suggestions.appendChild(li);
                });
            } else {
                suggestions.classList.add('hidden');
            }
            // Обновява таблицата в реално време с текущия текст (без Enter)
            if (isStatsPage) {
                fetchStats(search);
            } else {
                fetchOrders(document.getElementById('sort-date').dataset.sort, search);
            }
        });
    }, 300);

    input.addEventListener('input', function() {
        const search = this.value;
        if (search.length < 1) {
            suggestions.classList.add('hidden');
            if (isStatsPage) {
                fetchStats('');
            } else {
                fetchOrders(document.getElementById('sort-date').dataset.sort, '');
            }
            return;
        }
        debouncedFetch(search);
    });

    // Премахваме Enter събитието, тъй като ъпдейтът е автоматичен
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestions.contains(e.target)) {
            suggestions.classList.add('hidden');
        }
    });
}

document.addEventListener("DOMContentLoaded", function() {
    console.log("Страницата е заредена успешно!");

    // Сортиране по дата (само за index.php)
    const sortButton = document.getElementById('sort-date');
    if (sortButton) {
        sortButton.addEventListener('click', function() {
            const newSort = this.dataset.sort === 'desc' ? 'asc' : 'desc';
            this.dataset.sort = newSort;
            this.textContent = `Сортирай по дата ${newSort === 'desc' ? '↑' : '↓'}`;
            const searchTerm = document.getElementById('client-search').value;
            fetchOrders(newSort, searchTerm);
        });
    }

    // Автодопълване за търсене
    setupAutocomplete('client-search', 'client-suggestions');
    setupAutocomplete('client-search-stats', 'client-suggestions-stats');
    setupAutocomplete('client-search-invoice', 'client-suggestions-invoice', 'client-id-invoice');
    setupAutocomplete('client-search-offer', 'client-suggestions-offer', 'client-id-offer');
});