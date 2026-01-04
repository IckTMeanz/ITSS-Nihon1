// User Management JavaScript

const API_BASE = '/admin/api';

let users = [];
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalElements = 0;

// Load users on page load
window.addEventListener('DOMContentLoaded', () => {
    loadUsers();
    
    // Add debounce for search
    let searchTimeout;
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterUsers();
            }, 500);
        });
    }
});

// Load users from API
async function loadUsers() {
    try {
        const keyword = document.getElementById('userSearch')?.value || '';
        const roleType = document.getElementById('userRoleFilter')?.value || '';
        const status = document.getElementById('userStatusFilter')?.value || '';
        
        const params = new URLSearchParams({
            page: currentPage.toString(),
            size: pageSize.toString(),
            _t: new Date().getTime() // Thêm timestamp để tránh cache
        });
        if (keyword) params.append('keyword', keyword);
        if (roleType) params.append('roleType', roleType);
        if (status) params.append('status', status);

        const response = await fetch(`${API_BASE}/users?${params}`);
        const data = await response.json();
        
        users = data.content || [];
        totalPages = data.page?.totalPages || data.totalPages || 0;
        totalElements = data.page?.totalElements || data.totalElements || 0;
        
        renderUsers();
        renderPagination();
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('ユーザーの読み込みに失敗しました', 'error');
    }
}

// Render users table
function renderUsers() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">ユーザーが見つかりませんでした</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => {
        const roleBadge = user.roleType === 'admin'
            ? '<span class="badge active">管理者</span>'
            : '<span class="badge">一般</span>';
        
        const statusBadge = user.status === 'active'
            ? '<span class="badge active">アクティブ</span>'
            : '<span class="badge inactive">ロック中</span>';
        
        const formattedDate = user.updatedOn 
            ? new Date(user.updatedOn).toLocaleDateString('ja-JP')
            : '-';
        
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.name || ''}</td>
                <td>${user.email || ''}</td>
                <td>${roleBadge}</td>
                <td>${formattedDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-icon" onclick="viewUserDetail(${user.id})" title="詳細">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    ${user.status === 'active' 
                        ? `<button class="btn-icon btn-warning" onclick="banUser(${user.id})" title="ロック">`
                        : `<button class="btn-icon btn-success" onclick="unbanUser(${user.id})" title="ロック解除">`
                    }
                        <i class="fas fa-${user.status === 'active' ? 'lock' : 'unlock'}"></i>
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
        loadUsers();
    }
}

// Filter users
function filterUsers() {
    currentPage = 0;
    loadUsers();
}

// View user detail
async function viewUserDetail(id) {
    try {
        const response = await fetch(`${API_BASE}/users/${id}`);
        const user = await response.json();
        
        const content = document.getElementById('userDetailContent');
        const formattedDate = user.updatedOn 
            ? new Date(user.updatedOn).toLocaleDateString('ja-JP')
            : '-';
        
        content.innerHTML = `
            <div class="user-detail">
                <div class="user-detail-row">
                    <div class="user-detail-label">ユーザーID</div>
                    <div class="user-detail-value">${user.id}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">ユーザー名</div>
                    <div class="user-detail-value">${user.name || '-'}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">メールアドレス</div>
                    <div class="user-detail-value">${user.email || '-'}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">権限</div>
                    <div class="user-detail-value">${user.roleType === 'admin' ? '管理者' : '一般ユーザー'}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">ステータス</div>
                    <div class="user-detail-value">${user.status === 'active' ? 'アクティブ' : 'ロック中'}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">更新日時</div>
                    <div class="user-detail-value">${formattedDate}</div>
                </div>
            </div>
        `;
        
        document.getElementById('userModal').classList.add('show');
    } catch (error) {
        console.error('Error loading user:', error);
        showNotification('ユーザー情報の読み込みに失敗しました', 'error');
    }
}

// Close user modal
function closeUserModal() {
    document.getElementById('userModal').classList.remove('show');
}

// Ban user
async function banUser(id) {
    if (!confirm('このユーザーをロックしますか？')) {
        return;
    }

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

    try {
        const response = await fetch(`${API_BASE}/users/${id}/status?status=banned`, {
            method: 'PUT',
            headers: {
                [csrfHeader]: csrfToken
            }
        });

        if (response.ok) {
            showNotification('ユーザーをロックしました', 'success');
            setTimeout(() => loadUsers(), 200); // Đợi 200ms để DB kịp cập nhật
        } else {
            showNotification('ロックに失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error banning user:', error);
        showNotification('ロックに失敗しました', 'error');
    }
}

// Unban user
async function unbanUser(id) {
    if (!confirm('このユーザーのロックを解除しますか？')) {
        return;
    }

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

    try {
        const response = await fetch(`${API_BASE}/users/${id}/status?status=active`, {
            method: 'PUT',
            headers: {
                [csrfHeader]: csrfToken
            }
        });

        if (response.ok) {
            showNotification('ユーザーのロックを解除しました', 'success');
            setTimeout(() => loadUsers(), 200); // Đợi 200ms để DB kịp cập nhật
        } else {
            showNotification('ロック解除に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error unbanning user:', error);
        showNotification('ロック解除に失敗しました', 'error');
    } 
}
