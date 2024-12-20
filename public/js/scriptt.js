async function cekJadwal() {
    const tanggal = document.getElementById('tanggal').value;
    const jam = document.getElementById('jam').value;
    const statusJadwal = document.getElementById('statusJadwal');
  
    // Reset pesan status
    statusJadwal.textContent = '';
    statusJadwal.classList.remove('text-red-500', 'text-green-500');
  
    // Validasi input kosong
    if (!tanggal || !jam) {
        statusJadwal.textContent = 'Silakan isi tanggal dan jam terlebih dahulu.';
        statusJadwal.classList.add('text-red-500');
        return;
    }
  
    try {
        // Kirim data ke server menggunakan fetch API
        const response = await fetch('/cek-jadwal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tanggal, jam })
        });
  
        const result = await response.json();
  
        // Tampilkan hasil validasi
        if (result.available) {
            statusJadwal.textContent = result.message;
            statusJadwal.classList.add('text-green-500');
        } else {
            statusJadwal.textContent = result.message;
            statusJadwal.classList.add('text-red-500');
        }
    } catch (error) {
        console.error('Error checking schedule:', error);
        statusJadwal.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
        statusJadwal.classList.add('text-red-500');
    }
}

document.querySelectorAll('[data-tab]').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = button.getAttribute('data-tab');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Show selected tab content
        document.getElementById(tabId).classList.remove('hidden');
        
        // Update active state of nav items
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.classList.remove('bg-gray-700', 'text-white');
            btn.classList.add('text-gray-400');
        });
        button.classList.add('bg-gray-700', 'text-white');
        button.classList.remove('text-gray-400');

        // Update header title
        document.querySelector('header h2').textContent = tabId.charAt(0).toUpperCase() + tabId.slice(1);
    });
});

// Modal functions
function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// CRUD Operations
async function fetchDashboardStats() {
    try {
        const response = await fetch('/admin/api/stats');
        const stats = await response.json();
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalPackages').textContent = stats.totalPackages;
        document.getElementById('totalOrders').textContent = stats.totalOrders;
        document.getElementById('totalRevenue').textContent = `Rp ${stats.totalRevenue.toLocaleString('id-ID')}`;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
    }
}

async function fetchUsers() {
    try {
        const response = await fetch('/admin/api/users');
        const users = await response.json();
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="h-10 w-10 flex-shrink-0">
                            <img class="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name=${user.username}" alt="">
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-900">${user.username}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${user.email}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${user.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_admin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${user.is_admin ? 'Admin' : 'Bukan Admin'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editUser(${user.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

async function fetchPackages() {
    try {
        const response = await fetch('/admin/api/packages');
        const packages = await response.json();
        const tbody = document.getElementById('packagesTableBody');
        tbody.innerHTML = packages.map(pkg => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${pkg.name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">Rp ${pkg.price.toLocaleString('id-ID')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editPackage(${pkg.id})" class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deletePackage(${pkg.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching packages:', error);
    }
}

async function fetchOrders() {
    try {
        const response = await fetch('/admin/api/orders');
        const orders = await response.json();
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${order.username}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${order.package_name}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${new Date(order.order_date).toLocaleDateString('id-ID')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Completed
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="deleteOrder(${order.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

// Form submissions
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('userId').value;
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    try {
        const url = userId ? `/admin/api/users/${userId}` : '/admin/api/users';
        const method = userId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            hideModal('userModal');
            fetchUsers();
            document.getElementById('userForm').reset();
        }
    } catch (error) {
        console.error('Error submitting user form:', error);
    }
});

document.getElementById('packageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const packageId = document.getElementById('packageId').value;
    const packageData = {
        name: document.getElementById('packageName').value,
        price: document.getElementById('packagePrice').value
    };

    try {
        const url = packageId ? `/admin/api/packages/${packageId}` : '/admin/api/packages';
        const method = packageId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(packageData)
        });

        if (response.ok) {
            hideModal('packageModal');
            fetchPackages();
            document.getElementById('packageForm').reset();
        }
    } catch (error) {
        console.error('Error submitting package form:', error);
    }
});

// Delete functions
async function deleteUser(id) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            const response = await fetch(`/admin/api/users/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchUsers();
                fetchDashboardStats();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }
}

async function deletePackage(id) {
    if (confirm('Are you sure you want to delete this package?')) {
        try {
            const response = await fetch(`/admin/api/packages/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchPackages();
                fetchDashboardStats();
            }
        } catch (error) {
            console.error('Error deleting package:', error);
        }
    }
}

async function deleteOrder(id) {
    if (confirm('Are you sure you want to delete this order?')) {
        try {
            const response = await fetch(`/admin/api/orders/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchOrders();
                fetchDashboardStats();
            }
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    }
}

// Edit functions
function editUser(id) {
    fetch(`/admin/api/users/${id}`)
        .then(response => response.json())
        .then(user => {
            document.getElementById('userId').value = user.id;
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('password').value = '';
            showModal('userModal');
        })
        .catch(error => console.error('Error fetching user details:', error));
}

function editPackage(id) {
    fetch(`/admin/api/packages/${id}`)
        .then(response => response.json())
        .then(pkg => {
            document.getElementById('packageId').value = pkg.id;
            document.getElementById('packageName').value = pkg.name;
            document.getElementById('packagePrice').value = pkg.price;
            showModal('packageModal');
        })
        .catch(error => console.error('Error fetching package details:', error));
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardStats();
    fetchUsers();
    fetchPackages();
    fetchOrders();
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
}