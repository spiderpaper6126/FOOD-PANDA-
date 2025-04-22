let currentRestaurant = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user && user.type === 'admin') {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadRestaurantData(user.restaurantId);
    } else {
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }
}

function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password && u.type === 'admin');
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        checkAuth();
    } else {
        alert('Invalid credentials');
    }
}

function signup() {
    const name = document.getElementById('signup-name').value;
    const restaurant = document.getElementById('signup-restaurant').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(u => u.email === email)) {
        alert('Email already exists');
        return;
    }
    
    // Create restaurant
    const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
    const restaurantId = Date.now().toString();
    
    restaurants.push({
        id: restaurantId,
        name: restaurant,
        adminId: Date.now().toString(),
        categories: [],
        menuItems: []
    });
    
    // Create user
    users.push({
        id: Date.now().toString(),
        name,
        email,
        password,
        type: 'admin',
        restaurantId
    });
    
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    localStorage.setItem('currentUser', JSON.stringify(users[users.length-1]));
    
    checkAuth();
}

function logout() {
    localStorage.removeItem('currentUser');
    checkAuth();
}

function loadRestaurantData(restaurantId) {
    const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
    currentRestaurant = restaurants.find(r => r.id === restaurantId);
    
    if (!currentRestaurant) {
        alert('Restaurant not found');
        logout();
        return;
    }
    
    document.getElementById('restaurant-title').textContent = currentRestaurant.name;
    loadCategories();
    loadMenuItems();
}

function showSection(section) {
    document.getElementById('categories-section').style.display = 'none';
    document.getElementById('menu-section').style.display = 'none';
    document.getElementById(`${section}-section`).style.display = 'block';
    
    // Update active nav button
    document.querySelectorAll('nav button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function loadCategories() {
    const list = document.getElementById('category-list');
    list.innerHTML = '';
    
    if (currentRestaurant.categories.length === 0) {
        list.innerHTML = '<p>No categories yet</p>';
        return;
    }
    
    currentRestaurant.categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <span>${cat.name}</span>
            <div class="actions">
                <button class="edit-btn" onclick="editCategory('${cat.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteCategory('${cat.id}')">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
    
    // Update category dropdown
    const dropdown = document.getElementById('item-category');
    dropdown.innerHTML = '';
    currentRestaurant.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        dropdown.appendChild(option);
    });
}

function addCategory() {
    const name = document.getElementById('new-category').value.trim();
    if (!name) return;
    
    currentRestaurant.categories.push({
        id: Date.now().toString(),
        name
    });
    
    saveRestaurant();
    document.getElementById('new-category').value = '';
    loadCategories();
}

function editCategory(id) {
    const cat = currentRestaurant.categories.find(c => c.id === id);
    const newName = prompt('Edit category name:', cat.name);
    if (newName && newName.trim() !== '') {
        cat.name = newName.trim();
        saveRestaurant();
        loadCategories();
    }
}

function deleteCategory(id) {
    if (!confirm('Delete this category and all its items?')) return;
    
    currentRestaurant.categories = currentRestaurant.categories.filter(c => c.id !== id);
    currentRestaurant.menuItems = currentRestaurant.menuItems.filter(i => i.categoryId !== id);
    saveRestaurant();
    loadCategories();
    loadMenuItems();
}

function loadMenuItems() {
    const list = document.getElementById('item-list');
    list.innerHTML = '';
    
    if (currentRestaurant.menuItems.length === 0) {
        list.innerHTML = '<p>No menu items yet</p>';
        return;
    }
    
    currentRestaurant.menuItems.forEach(item => {
        const cat = currentRestaurant.categories.find(c => c.id === item.categoryId);
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:15px">
                ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
                <div>
                    <h3>${item.name}</h3>
                    <p>${item.description || ''}</p>
                    <small>${cat?.name || 'Uncategorized'} - $${item.price.toFixed(2)}</small>
                </div>
            </div>
            <div class="actions">
                <button class="edit-btn" onclick="editMenuItem('${item.id}')">Edit</button>
                <button class="delete-btn" onclick="deleteMenuItem('${item.id}')">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function addMenuItem() {
    const categoryId = document.getElementById('item-category').value;
    const name = document.getElementById('item-name').value.trim();
    const desc = document.getElementById('item-desc').value.trim();
    const price = parseFloat(document.getElementById('item-price').value);
    const image = document.getElementById('item-image').value.trim();
    
    if (!categoryId || !name || isNaN(price)) {
        alert('Please fill required fields');
        return;
    }
    
    currentRestaurant.menuItems.push({
        id: Date.now().toString(),
        categoryId,
        name,
        description: desc,
        price,
        image
    });
    
    saveRestaurant();
    resetItemForm();
    loadMenuItems();
}

function resetItemForm() {
    document.getElementById('item-name').value = '';
    document.getElementById('item-desc').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-image').value = '';
}

function editMenuItem(id) {
    const item = currentRestaurant.menuItems.find(i => i.id === id);
    if (!item) return;
    
    // Fill form
    document.getElementById('item-category').value = item.categoryId;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-desc').value = item.description;
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-image').value = item.image;
    
    // Change button to update
    const btn = document.querySelector('#menu-section .add-form button');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-save"></i> Update';
    btn.onclick = function() { updateMenuItem(id); };
    
    // Add cancel button
    const cancel = document.createElement('button');
    cancel.innerHTML = '<i class="fas fa-times"></i> Cancel';
    cancel.style.marginLeft = '10px';
    cancel.style.background = '#999';
    cancel.onclick = function() {
        resetItemForm();
        btn.innerHTML = oldText;
        btn.onclick = function() { addMenuItem(); };
        cancel.remove();
    };
    
    btn.parentNode.appendChild(cancel);
}

function updateMenuItem(id) {
    const item = currentRestaurant.menuItems.find(i => i.id === id);
    if (!item) return;
    
    item.categoryId = document.getElementById('item-category').value;
    item.name = document.getElementById('item-name').value.trim();
    item.description = document.getElementById('item-desc').value.trim();
    item.price = parseFloat(document.getElementById('item-price').value);
    item.image = document.getElementById('item-image').value.trim();
    
    saveRestaurant();
    resetItemForm();
    loadMenuItems();
    
    // Reset button
    const btn = document.querySelector('#menu-section .add-form button');
    btn.innerHTML = '<i class="fas fa-plus"></i> Add Item';
    btn.onclick = function() { addMenuItem(); };
    document.querySelector('#menu-section .add-form button + button').remove();
}

function deleteMenuItem(id) {
    if (!confirm('Delete this menu item?')) return;
    currentRestaurant.menuItems = currentRestaurant.menuItems.filter(i => i.id !== id);
    saveRestaurant();
    loadMenuItems();
}

function saveRestaurant() {
    const restaurants = JSON.parse(localStorage.getItem('restaurants')) || [];
    const index = restaurants.findIndex(r => r.id === currentRestaurant.id);
    if (index !== -1) {
        restaurants[index] = currentRestaurant;
        localStorage.setItem('restaurants', JSON.stringify(restaurants));
    }
}