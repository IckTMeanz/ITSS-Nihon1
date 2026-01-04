// Review Management JavaScript

const API_BASE = '/admin/api';

let reviews = [];
let currentPage = 0;
let pageSize = 10;
let totalPages = 0;
let totalElements = 0;

// Load reviews on page load
window.addEventListener('DOMContentLoaded', () => {
    loadReviews();
    
    // Add debounce for search
    let searchTimeout;
    const searchInput = document.getElementById('reviewSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterReviews();
            }, 500);
        });
    }
});

// Approve all pending reviews
async function approveAllPendingReviews() {
    // First, check how many pending reviews there are
    try {
        const params = new URLSearchParams({
            page: '0',
            size: '1',
            status: 'pending'
        });

        const checkResponse = await fetch(`${API_BASE}/reviews?${params}`);
        const checkData = await checkResponse.json();
        
        const totalPending = checkData.totalElements || 0;
        
        if (totalPending === 0) {
            showNotification('承認待ちのレビューがありません', 'info');
            return;
        }

        if (!confirm(`${totalPending}件のレビューをすべて承認しますか？`)) {
            return;
        }

        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
        const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

        // Approve all pending reviews using the API endpoint
        const response = await fetch(`${API_BASE}/reviews/approve-all`, {
            method: 'POST',
            headers: {
                [csrfHeader]: csrfToken
            }
        });

        if (response.ok) {
            const result = await response.json();
            showNotification(result.message || `${result.count}件のレビューを承認しました`, 'success');
            setTimeout(() => {
                loadReviews();
                updateReviewStats();
            }, 200);
        } else {
            showNotification('レビューの承認に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error approving all reviews:', error);
        showNotification('レビューの承認に失敗しました', 'error');
    }
}

// Load reviews from API
async function loadReviews() {
    try {
        const keyword = document.getElementById('reviewSearch')?.value || '';
        const status = document.getElementById('reviewStatusFilter')?.value || '';
        const rating = document.getElementById('reviewRatingFilter')?.value || '';
        
        const params = new URLSearchParams({
            page: currentPage.toString(),
            size: pageSize.toString()
        });
        if (keyword) params.append('keyword', keyword);
        if (status) params.append('status', status);
        if (rating) params.append('star', rating);

        const response = await fetch(`${API_BASE}/reviews?${params}`);
        const data = await response.json();
        
        reviews = data.content || [];
        totalPages = data.page?.totalPages || data.totalPages || 0;
        totalElements = data.page?.totalElements || data.totalElements || 0;
        
        renderReviews();
        renderPagination();
    } catch (error) {
        console.error('Error loading reviews:', error);
        showNotification('レビューの読み込みに失敗しました', 'error');
    }
}

// Update review statistics
async function updateReviewStats() {
    try {
        // Fetch pending count
        const pendingRes = await fetch(`${API_BASE}/reviews?status=pending&size=1`);
        const pendingData = await pendingRes.json();
        const pendingCount = pendingData.page?.totalElements || pendingData.totalElements || 0;
        
        // Fetch published count
        const publishedRes = await fetch(`${API_BASE}/reviews?status=published&size=1`);
        const publishedData = await publishedRes.json();
        const publishedCount = publishedData.page?.totalElements || publishedData.totalElements || 0;

        const pendingEl = document.getElementById('pendingReviewsCount');
        if (pendingEl) pendingEl.textContent = pendingCount;

        const publishedEl = document.getElementById('publishedReviewsCount');
        if (publishedEl) publishedEl.textContent = publishedCount;
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Render reviews
function renderReviews() {
    const container = document.getElementById('reviewList');
    if (!container) return;

    if (reviews.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem;">レビューが見つかりませんでした</div>';
        return;
    }

    container.innerHTML = reviews.map(review => {
        const stars = '★'.repeat(review.star || 0);
        const statusBadge = getStatusBadge(review.status);
        const formattedDate = review.createdAt 
            ? new Date(review.createdAt).toLocaleString('ja-JP')
            : '-';
        
        return `
            <div class="monitoring-item">
                <div class="monitoring-header">
                    <div class="monitoring-user">
                        <i class="fas fa-user-circle"></i>
                        <div class="monitoring-user-info">
                            <h4>${review.userName || 'Unknown'}</h4>
                            <small>${review.cafeName || 'Unknown'} - ${formattedDate}</small>
                        </div>
                    </div>
                    <div>
                        <div class="monitoring-rating">${stars} ${review.star || 0}</div>
                        ${statusBadge}
                    </div>
                </div>
                <div class="monitoring-content">
                    ${review.content || ''}
                </div>
                <div class="monitoring-actions">
                    ${review.status === 'pending' ? `
                        <button class="btn-success btn-sm" onclick="approveReview(${review.id})">
                            <i class="fas fa-check"></i> 承認
                        </button>
                    ` : ''}
                    <button class="btn-danger btn-sm" onclick="deleteReview(${review.id})">
                        <i class="fas fa-trash"></i> 削除
                    </button>
                    <button class="btn-secondary btn-sm" onclick="viewReviewDetail(${review.id})">
                        <i class="fas fa-info-circle"></i> 詳細
                    </button>
                </div>
            </div>
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
        const reviewList = document.getElementById('reviewList');
        if (reviewList && reviewList.parentNode) {
            reviewList.parentNode.insertBefore(paginationContainer, reviewList.nextSibling);
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
        loadReviews();
    }
}

// Get status badge
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="badge pending">要確認</span>',
        published: '<span class="badge active">承認済み</span>'
    };
    return badges[status] || '';
}

// Filter reviews
function filterReviews() {
    currentPage = 0;
    loadReviews();
}

// Approve review
async function approveReview(id) {
    if (!confirm('このレビューを承認しますか？')) {
        return;
    }

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

    try {
        const response = await fetch(`${API_BASE}/reviews/${id}/status?status=published`, {
            method: 'PUT',
            headers: {
                [csrfHeader]: csrfToken
            }
        });

        if (response.ok) {
            showNotification('レビューを承認しました', 'success');
            setTimeout(() => {
                loadReviews();
                updateReviewStats();
            }, 200);
        } else {
            showNotification('承認に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error approving review:', error);
        showNotification('承認に失敗しました', 'error');
    }
}

// Delete review
async function deleteReview(id) {
    if (!confirm('このレビューを削除しますか？この操作は取り消せません。')) {
        return;
    }

    // Get CSRF token
    const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content;

    try {
        const response = await fetch(`${API_BASE}/reviews/${id}`, {
            method: 'DELETE',
            headers: {
                [csrfHeader]: csrfToken
            }
        });

        if (response.ok) {
            showNotification('レビューを削除しました', 'success');
            setTimeout(() => {
                loadReviews();
                updateReviewStats();
            }, 200);
        } else {
            showNotification('削除に失敗しました', 'error');
        }
    } catch (error) {
        console.error('Error deleting review:', error);
        showNotification('削除に失敗しました', 'error');
    }
}

// View review detail
async function viewReviewDetail(id) {
    try {
        const response = await fetch(`${API_BASE}/reviews/${id}`);
        const review = await response.json();
        
        const stars = '★'.repeat(review.star || 0);
        const content = document.getElementById('reviewDetailContent');
        const formattedDate = review.createdAt 
            ? new Date(review.createdAt).toLocaleString('ja-JP')
            : '-';
        
        content.innerHTML = `
            <div class="user-detail">
                <div class="user-detail-row">
                    <div class="user-detail-label">レビューID</div>
                    <div class="user-detail-value">${review.id}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">投稿者</div>
                    <div class="user-detail-value">${review.userName || 'Unknown'} (${review.userEmail || '-'})</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">対象カフェ</div>
                    <div class="user-detail-value">${review.cafeName || 'Unknown'}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">評価</div>
                    <div class="user-detail-value">${stars} ${review.star || 0}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">投稿日時</div>
                    <div class="user-detail-value">${formattedDate}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">ステータス</div>
                    <div class="user-detail-value">${getStatusBadge(review.status)}</div>
                </div>
                <div class="user-detail-row">
                    <div class="user-detail-label">内容</div>
                    <div class="user-detail-value">${review.content || ''}</div>
                </div>
            </div>
        `;
        
        document.getElementById('reviewModal').classList.add('show');
    } catch (error) {
        console.error('Error loading review:', error);
        showNotification('レビュー情報の読み込みに失敗しました', 'error');
    }
}

// Close review modal
function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('show');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('reviewModal');
    if (event.target === modal) {
        closeReviewModal();
    }
}
