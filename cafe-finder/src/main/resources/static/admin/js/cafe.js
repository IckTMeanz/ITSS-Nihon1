// Cafe Management JavaScript

const API_BASE = '/admin/api';

let cafes = [];
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalElements = 0;
let currentCafeId = null; // Biến theo dõi ID quán cafe đang sửa

// Load cafes on page load
window.addEventListener('DOMContentLoaded', () => {
    loadCafes();
    
    // Add debounce for search
    let searchTimeout;
    const searchInput = document.getElementById('cafeSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterCafes();
            }, 500);
        });
    }
});

// Load cafes from API
async function loadCafes() {
    try {
        const keyword = document.getElementById('cafeSearch')?.value || '';
        const status = document.getElementById('cafeStatusFilter')?.value || '';
        
        const params = new URLSearchParams({
            page: currentPage.toString(),
            size: pageSize.toString()
        });
        if (keyword) params.append('keyword', keyword);
        if (status) params.append('status', status);

        const response = await fetch(`${API_BASE}/cafes?${params}`);
        const data = await response.json();
        
        cafes = data.content || [];
        totalPages = data.page?.totalPages || data.totalPages || 0;
        totalElements = data.page?.totalElements || data.totalElements || 0;
        
        renderCafes();
        renderPagination();
    } catch (error) {
        console.error('Error loading cafes:', error);
        showNotification('カフェの読み込みに失敗しました', 'error');
    }
}

// Render cafes table
function renderCafes() {
    const tbody = document.getElementById('cafeTableBody');
    if (!tbody) return;

    if (cafes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">カフェが見つかりませんでした</td></tr>';
        return;
    }

    tbody.innerHTML = cafes.map(cafe => {
        const statusBadge = cafe.status === 'opening' 
            ? '<span class="badge active">営業中</span>'
            : '<span class="badge inactive">閉店</span>';
        
        return `
            <tr>
                <td>${cafe.id}</td>
                <td>${cafe.name || ''}</td>
                <td>${cafe.address || ''}</td>
                <td>${cafe.rating || 0}</td>
                <td>${cafe.reviewCount || 0}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-icon" onclick="viewCafeDetail(${cafe.id})" title="詳細">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn-icon" onclick="editCafe(${cafe.id})" title="編集">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-danger" onclick="deleteCafe(${cafe.id})" title="削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Render pagination
function renderPagination() {
    let paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) {
        paginationContainer = document.createElement('div');
        paginationContainer.id = 'pagination';
        paginationContainer.className = 'pagination';
        const tableContainer = document.querySelector('.data-table-container');
        if (tableContainer) {
            tableContainer.parentNode.insertBefore(paginationContainer, tableContainer.nextSibling);
        }
    }

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-info">';
    html += `表示中: ${currentPage * pageSize + 1}-${Math.min((currentPage + 1) * pageSize, totalElements)} / ${totalElements}件`;
    html += '</div>';
    html += '<div class="pagination-controls">';
    
    // Previous button
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 0 ? 'disabled' : ''}>`;
    html += '<i class="fas fa-chevron-left"></i> 前へ';
    html += '</button>';
    
    // Page numbers
    const startPage = Math.max(0, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);
    
    if (startPage > 0) {
        html += `<button class="pagination-btn" onclick="goToPage(0)">1</button>`;
        if (startPage > 1) html += '<span class="pagination-ellipsis">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i + 1}</button>`;
    }
    
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) html += '<span class="pagination-ellipsis">...</span>';
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages - 1})">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>`;
    html += '次へ <i class="fas fa-chevron-right"></i>';
    html += '</button>';
    
    html += '</div>';
    paginationContainer.innerHTML = html;
}

// Go to page
function goToPage(page) {
    if (page >= 0 && page < totalPages) {
        currentPage = page;
        loadCafes();
    }
}

// Filter cafes
function filterCafes() {
    currentPage = 0;
    loadCafes();
}

// View cafe detail (with menu)
async function viewCafeDetail(id) {
    try {
        const response = await fetch(`${API_BASE}/cafes/${id}`);
        const cafe = await response.json();
        
        const modal = document.getElementById('cafeDetailModal');
        if (!modal) {
            createCafeDetailModal();
        }
        
        const content = document.getElementById('cafeDetailContent');
        const formattedDate = cafe.updatedOn 
            ? new Date(cafe.updatedOn).toLocaleString('ja-JP')
            : '-';
        
        let html = `
            <div class="cafe-detail" data-cafe-id="${cafe.id}">
                <div class="cafe-detail-header">
                    <img src="${getImageUrl(cafe.image)}" alt="${cafe.name}" class="cafe-detail-image" onerror="this.src='/images/placeholder.png'">
                    <div class="cafe-detail-info">
                        <h2>${cafe.name || ''}</h2>
                        <div class="cafe-detail-meta">
                            <span><i class="fas fa-star"></i> ${cafe.rating || 0}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${cafe.address || ''}</span>
                            <span><i class="fas fa-clock"></i> ${cafe.time || '-'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="cafe-detail-section">
                    <h3>説明</h3>
                    <p>${cafe.description || '-'}</p>
                </div>
                
                <div class="cafe-detail-section">
                    <h3>メニュー</h3>
        `;
        
        if (cafe.dishes && cafe.dishes.length > 0) {
            html += '<div class="menu-grid">';
            cafe.dishes.forEach(dish => {
                html += `
                    <div class="menu-item-card">
                        <img src="${getImageUrl(dish.image)}" alt="${dish.name}" class="menu-item-image" onerror="this.src='/images/placeholder.png'">
                        <div class="menu-item-info">
                            <h4>${dish.name || ''}</h4>
                            <p class="menu-item-price">¥${dish.price || 0}</p>
                            ${dish.description ? `<p class="menu-item-description">${dish.description}</p>` : ''}
                            <button class="btn-icon" onclick="openEditDishModal(${dish.id})" title="メニューを編集"><i class="fas fa-edit"></i></button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += '<p style="color: #999;">メニューが登録されていません</p>';
        }
        
        html += `
                </div>
                
                <div class="cafe-detail-section">
                    <h3>その他の情報</h3>
                    <div class="cafe-detail-row">
                        <div class="cafe-detail-label">距離</div>
                        <div class="cafe-detail-value">${cafe.distance || 0} km</div>
                    </div>
                    <div class="cafe-detail-row">
                        <div class="cafe-detail-label">ステータス</div>
                        <div class="cafe-detail-value">
                            ${cafe.status === 'opening' ? '<span class="badge active">営業中</span>' : '<span class="badge inactive">閉店</span>'}
                        </div>
                    </div>
                    <div class="cafe-detail-row">
                        <div class="cafe-detail-label">更新日時</div>
                        <div class="cafe-detail-value">${formattedDate}</div>
                    </div>
                </div>
            </div>
        `;
        
        content.innerHTML = html;
        document.getElementById('cafeDetailModal').classList.add('show');
    } catch (error) {
        console.error('Error loading cafe detail:', error);
        showNotification('カフェ情報の読み込みに失敗しました', 'error');
    }
}

// Create cafe detail modal
function createCafeDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'cafeDetailModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>カフェ詳細</h2>
                <span class="modal-close" onclick="closeCafeDetailModal()">&times;</span>
            </div>
            <div id="cafeDetailContent"></div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeCafeDetailModal()">閉じる</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close cafe detail modal
function closeCafeDetailModal() {
    const modal = document.getElementById('cafeDetailModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Open add cafe modal
function openAddCafeModal() {
    currentCafeId = null; // Reset ID khi thêm mới
    document.getElementById('modalTitle').textContent = 'カフェ追加';
    document.getElementById('cafeForm').reset();
    renderMenuItems([]);
    document.getElementById('cafeForm').onsubmit = (e) => saveCafe(e, null);
    document.getElementById('cafeModal').classList.add('show');
}

// Edit cafe
async function editCafe(id) {
    try {
        const response = await fetch(`${API_BASE}/cafes/${id}`);
        const cafe = await response.json();
        currentCafeId = id; // Lưu ID quán đang sửa
        
        document.getElementById('modalTitle').textContent = 'カフェ編集';
        document.getElementById('cafeName').value = cafe.name || '';
        document.getElementById('cafeAddress').value = cafe.address || '';
        document.getElementById('cafeLat').value = cafe.lat || '';
        document.getElementById('cafeLng').value = cafe.lng || '';
        document.getElementById('cafeImage').value = cafe.image || '';
        document.getElementById('cafeDescription').value = cafe.description || '';
        document.getElementById('cafeHours').value = cafe.time || '';
        renderMenuItems(cafe.dishes || []);

        document.getElementById('cafeForm').onsubmit = (e) => saveCafe(e, id);
        document.getElementById('cafeModal').classList.add('show');
    } catch (error) {
        console.error('Error loading cafe:', error);
        showNotification('カフェ情報の読み込みに失敗しました', 'error');
    }
}

// Save cafe
async function saveCafe(event, id) {
    if (event) event.preventDefault(); // Cho phép gọi hàm mà không cần event
    
    const cafeData = {
        name: document.getElementById('cafeName').value,
        address: document.getElementById('cafeAddress').value,
        lat: document.getElementById('cafeLat').value ? parseFloat(document.getElementById('cafeLat').value) : null,
        lng: document.getElementById('cafeLng').value ? parseFloat(document.getElementById('cafeLng').value) : null,
        image: document.getElementById('cafeImage').value,
        description: document.getElementById('cafeDescription').value,
        time: document.getElementById('cafeHours').value,
        status: 'opening',
        dishes: collectDishes()
    };

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

    try {
        const url = id ? `${API_BASE}/cafes/${id}` : `${API_BASE}/cafes`;
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            },
            body: JSON.stringify(cafeData)
        });

        if (response.ok) {
            showNotification(id ? 'カフェを更新しました' : 'カフェを追加しました', 'success');
            closeCafeModal();
            loadCafes();
        } else {
            showNotification('保存に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error saving cafe:', error);
        showNotification('保存に失敗しました', 'error');
    }
}

// Delete cafe
async function deleteCafe(id) {
    if (!confirm('このカフェを削除しますか？この操作は取り消せません。')) {
        return;
    }

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

    try {
        const response = await fetch(`${API_BASE}/cafes/${id}`, {
            method: 'DELETE',
            headers: {
                [csrfHeader]: csrfToken
            }
        });

        if (response.ok) {
            showNotification('カフェを削除しました', 'success');
            loadCafes();
        } else {
            showNotification('削除に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error deleting cafe:', error);
        showNotification('削除に失敗しました', 'error');
    }
}

// Close modal
function closeCafeModal() {
    document.getElementById('cafeModal').classList.remove('show');
}

// Add menu item
function addMenuItem() {
    const container = document.getElementById('menuItems');
    const newItem = document.createElement('div');
    newItem.className = 'menu-item-row';
    newItem.innerHTML = `
        <input type="text" placeholder="メニュー名" class="menu-name">
        <input type="text" placeholder="価格 (例: ¥450)" class="menu-price">
        <input type="text" placeholder="説明" class="menu-description">
        <div style="display:flex; gap:5px; flex:1;">
            <input type="text" placeholder="画像URL" class="menu-image" style="width:100%">
            <input type="file" accept="image/*" style="display:none" onchange="handleFileUpload(this, this.previousElementSibling)">
            <button type="button" class="btn-icon" onclick="this.previousElementSibling.click()"><i class="fas fa-upload"></i></button>
        </div>
        <button type="button" class="btn-icon" onclick="removeMenuItem(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(newItem);
}

// Remove menu item
function removeMenuItem(button) {
    button.closest('.menu-item-row').remove();
}

// Render menu items from API data
function renderMenuItems(dishes) {
    const container = document.getElementById('menuItems');
    if (!container) return;
    container.innerHTML = '';

    if (!dishes || dishes.length === 0) {
        addMenuItem();
        return;
    }

    dishes.forEach(dish => {
        const row = document.createElement('div');
        row.className = 'menu-item-row';
        if (dish.id) row.dataset.id = dish.id;
        row.innerHTML = `
            <input type="text" placeholder="メニュー名" class="menu-name" value="${dish.name || ''}">
            <input type="text" placeholder="価格 (例: ¥450)" class="menu-price" value="${dish.price || ''}">
            <input type="text" placeholder="説明" class="menu-description" value="${dish.description || ''}">
            <div style="display:flex; gap:5px; flex:1;">
                <input type="text" placeholder="画像URL" class="menu-image" value="${dish.image || ''}" style="width:100%">
                <input type="file" accept="image/*" style="display:none" onchange="handleFileUpload(this, this.previousElementSibling)">
                <button type="button" class="btn-icon" onclick="this.previousElementSibling.click()"><i class="fas fa-upload"></i></button>
            </div>
            <button type="button" class="btn-icon" onclick="removeMenuItem(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(row);
    });
}

// Collect dishes from form
function collectDishes() {
    const rows = document.querySelectorAll('#menuItems .menu-item-row');
    const dishes = [];
    rows.forEach(row => {
        const id = row.dataset.id;
        const name = row.querySelector('.menu-name')?.value?.trim();
        const price = row.querySelector('.menu-price')?.value;
        const description = row.querySelector('.menu-description')?.value?.trim();
        const image = row.querySelector('.menu-image')?.value?.trim();
        if (!name && !price && !description && !image) return;
        
        const dishObj = {
            name,
            price: price ? parseFloat(price) : 0,
            description,
            image
        };
        if (id) dishObj.id = parseInt(id);
        dishes.push(dishObj);
    });
    return dishes;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = ['cafeModal', 'cafeDetailModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (modalId === 'cafeModal') {
                closeCafeModal();
            } else {
                closeCafeDetailModal();
            }
        }
    });
}

// Open edit dish modal
async function openEditDishModal(dishId) {
    try {
        const response = await fetch(`${API_BASE}/dishes/${dishId}`);
        const dish = await response.json();

        // Populate the dish edit modal with the dish details
        document.getElementById('editDishId').value = dish.id;
        document.getElementById('editDishName').value = dish.name || '';
        document.getElementById('editDishPrice').value = dish.price || '';
        document.getElementById('editDishDescription').value = dish.description || '';
        document.getElementById('editDishImage').value = dish.image || '';

        // Show the dish edit modal
        document.getElementById('editDishModal').classList.add('show');
    } catch (error) {
        console.error('Error loading dish details:', error);
        showNotification('メニュー情報の読み込みに失敗しました', 'error');
    }
}

// Save edited dish
async function saveEditedDish() {
    const dishId = document.getElementById('editDishId').value;
    const dishData = {
        name: document.getElementById('editDishName').value,
        price: parseFloat(document.getElementById('editDishPrice').value) || 0,
        description: document.getElementById('editDishDescription').value,
        image: document.getElementById('editDishImage').value
    };

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

    try {
        const response = await fetch(`${API_BASE}/dishes/${dishId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            },
            body: JSON.stringify(dishData)
        });

        if (response.ok) {
            showNotification('メニューを更新しました', 'success');
            closeEditDishModal();
            // Reload cafe details to reflect the changes
            const cafeId = document.querySelector('#cafeDetailModal .cafe-detail').dataset.cafeId;
            viewCafeDetail(cafeId);
        } else {
            showNotification('メニューの更新に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error saving dish:', error);
        showNotification('メニューの更新に失敗しました', 'error');
    }
}

async function handleFileUpload(input, targetIdOrElement) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            headers: {
                [csrfHeader]: csrfToken
            }
        });

        if (response.ok) {
            const imageUrl = await response.text();
            // Điền URL trả về vào ô input text để khi bấm Save Cafe sẽ lưu URL này
            const target = typeof targetIdOrElement === 'string' ? document.getElementById(targetIdOrElement) : targetIdOrElement;
            target.value = imageUrl;
            showNotification('画像がアップロードされました', 'success');
        }
    } catch (error) {
        console.error('Upload failed', error);
    }
}

// Helper function to get correct image URL
function getImageUrl(image) {
    if (!image) return '/images/placeholder.png';
    if (image.startsWith('http') || image.startsWith('https')) return image;
    return '/images/' + image;
}


// Close edit dish modal
function closeEditDishModal() {
    document.getElementById('editDishModal').classList.remove('show');
}

// Create edit dish modal (hidden by default)
document.body.insertAdjacentHTML('beforeend', `
    <div class="modal" id="editDishModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>メニュー編集</h2>
                <span class="modal-close" onclick="closeEditDishModal()">&times;</span>
            </div>
            <div class="modal-body">
                <input type="hidden" id="editDishId">
                <label for="editDishName">メニュー名:</label>
                <input type="text" id="editDishName"><br>

                <label for="editDishPrice">価格:</label>
                <input type="text" id="editDishPrice"><br>

                <label for="editDishDescription">説明:</label>
                <textarea id="editDishDescription"></textarea><br>

                <label for="editDishImage">画像 URL:</label>
                <div style="display:flex; gap:5px;">
                    <input type="text" id="editDishImage" style="flex:1">
                    <input type="file" accept="image/*" style="display:none" onchange="handleFileUpload(this, document.getElementById('editDishImage'))">
                    <button type="button" class="btn-secondary" onclick="this.previousElementSibling.click()"><i class="fas fa-upload"></i></button>
                </div><br>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-primary" onclick="saveEditedDish()">保存</button>
                <button type="button" class="btn-secondary" onclick="closeEditDishModal()">キャンセル</button>
            </div>
        </div>
    </div>
`);

// Listen for clicks outside the modal to close it
window.addEventListener('click', function(event) {
    if (event.target == document.getElementById('editDishModal')) {
        closeEditDishModal();
    }
});
