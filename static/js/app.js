document.addEventListener('DOMContentLoaded', () => {
    // Application State
    let allReleases = [];
    let activeFilters = {
        search: '',
        type: 'all',
        sort: 'desc'
    };

    // DOM Elements
    const btnRefresh = document.getElementById('btn-refresh');
    const btnInitialLoad = document.getElementById('btn-initial-load');
    const btnRetryLoad = document.getElementById('btn-retry-load');
    const searchInput = document.getElementById('search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const filterType = document.getElementById('filter-type');
    const sortOrder = document.getElementById('sort-order');
    const statsBar = document.getElementById('stats-bar');
    const statsText = document.getElementById('stats-text');
    const activeFiltersChips = document.getElementById('active-filters-chips');
    
    // Status states
    const feedStatus = document.getElementById('feed-status');
    const errorStatus = document.getElementById('error-status');
    const errorMessage = document.getElementById('error-message');
    const feedSkeleton = document.getElementById('feed-skeleton');
    const releasesList = document.getElementById('releases-list');

    // Twitter Modal Elements
    const twitterModal = document.getElementById('twitter-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const btnSendTweet = document.getElementById('btn-send-tweet');
    const charCount = document.getElementById('char-count');
    const ringProgress = document.getElementById('ring-progress');
    const linkCardTitle = document.getElementById('link-card-title');

    // Initial Event Listeners
    btnRefresh.addEventListener('click', fetchReleases);
    btnInitialLoad.addEventListener('click', fetchReleases);
    btnRetryLoad.addEventListener('click', fetchReleases);

    // Filter Listeners
    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value.trim().toLowerCase();
        toggleClearSearchButton();
        applyFiltersAndRender();
    });

    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        activeFilters.search = '';
        btnClearSearch.classList.add('hidden');
        applyFiltersAndRender();
        searchInput.focus();
    });

    filterType.addEventListener('change', (e) => {
        activeFilters.type = e.target.value;
        applyFiltersAndRender();
    });

    sortOrder.addEventListener('change', (e) => {
        activeFilters.sort = e.target.value;
        applyFiltersAndRender();
    });

    // Twitter Modal Listeners
    btnCloseModal.addEventListener('click', closeTwitterModal);
    twitterModal.addEventListener('click', (e) => {
        if (e.target === twitterModal) closeTwitterModal();
    });
    
    tweetTextarea.addEventListener('input', updateCharCount);

    btnSendTweet.addEventListener('click', () => {
        const text = tweetTextarea.value;
        if (text.length > 0 && text.length <= 280) {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(twitterUrl, '_blank', 'noopener,noreferrer');
            closeTwitterModal();
        }
    });

    // Show/hide clear search icon
    function toggleClearSearchButton() {
        if (searchInput.value.length > 0) {
            btnClearSearch.classList.remove('hidden');
        } else {
            btnClearSearch.classList.add('hidden');
        }
    }

    // Load Release Notes from Flask API
    async function fetchReleases() {
        showLoadingState();
        
        try {
            const response = await fetch('/api/releases');
            const result = await response.json();
            
            if (result.status === 'success') {
                allReleases = result.data;
                hideLoadingState();
                applyFiltersAndRender();
            } else {
                showErrorState(result.message || 'Error fetching release notes.');
            }
        } catch (error) {
            showErrorState('No se pudo conectar con el servidor backend. Asegúrate de que Flask está ejecutándose.');
            console.error('Fetch error:', error);
        }
    }

    // Loading State Transitions
    function showLoadingState() {
        // Disable buttons & show loading spinners
        btnRefresh.disabled = true;
        btnRefresh.querySelector('.btn-text').classList.add('hidden');
        btnRefresh.querySelector('.btn-loader').classList.remove('hidden');
        
        feedStatus.classList.add('hidden');
        errorStatus.classList.add('hidden');
        releasesList.classList.add('hidden');
        
        // Show skeleton loading placeholders
        feedSkeleton.classList.remove('hidden');
    }

    function hideLoadingState() {
        btnRefresh.disabled = false;
        btnRefresh.querySelector('.btn-text').classList.remove('hidden');
        btnRefresh.querySelector('.btn-loader').classList.add('hidden');
        
        feedSkeleton.classList.add('hidden');
        releasesList.classList.remove('hidden');
    }

    function showErrorState(msg) {
        hideLoadingState();
        errorMessage.textContent = msg;
        errorStatus.classList.remove('hidden');
        releasesList.classList.add('hidden');
        statsBar.classList.add('hidden');
    }

    // Core Filtering and Sorting Logic
    function applyFiltersAndRender() {
        if (allReleases.length === 0) {
            feedStatus.classList.remove('hidden');
            releasesList.classList.add('hidden');
            statsBar.classList.add('hidden');
            return;
        }

        let filteredData = [];
        let totalCount = 0;

        allReleases.forEach(release => {
            // Filter updates within the release
            const matchingUpdates = release.updates.filter(update => {
                const matchesType = activeFilters.type === 'all' || 
                                    (activeFilters.type === 'General' && !['Feature', 'Issue', 'Changed', 'Deprecation'].includes(update.type)) ||
                                    update.type === activeFilters.type;
                
                const matchesSearch = !activeFilters.search || 
                                      update.type.toLowerCase().includes(activeFilters.search) || 
                                      update.content_text.toLowerCase().includes(activeFilters.search) ||
                                      release.date.toLowerCase().includes(activeFilters.search);
                
                return matchesType && matchesSearch;
            });

            if (matchingUpdates.length > 0) {
                totalCount += matchingUpdates.length;
                filteredData.push({
                    ...release,
                    updates: matchingUpdates
                });
            }
        });

        // Sort release groups by date
        filteredData.sort((a, b) => {
            // Try sorting using parsed dates, fallback to lexicographical
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            
            if (!isNaN(dateA) && !isNaN(dateB)) {
                return activeFilters.sort === 'desc' ? dateB - dateA : dateA - dateB;
            }
            return activeFilters.sort === 'desc' ? 
                b.date.localeCompare(a.date) : 
                a.date.localeCompare(b.date);
        });

        renderStats(totalCount);
        renderReleases(filteredData);
    }

    // Stats bar renderer
    function renderStats(count) {
        statsBar.classList.remove('hidden');
        statsText.textContent = `Mostrando ${count} ${count === 1 ? 'actualización' : 'actualizaciones'}`;
        
        // Render filter chips
        activeFiltersChips.innerHTML = '';
        
        if (activeFilters.type !== 'all') {
            createFilterChip('Tipo: ' + activeFilters.type, () => {
                filterType.value = 'all';
                activeFilters.type = 'all';
                applyFiltersAndRender();
            });
        }
        
        if (activeFilters.search) {
            const displaySearch = activeFilters.search.length > 15 ? 
                activeFilters.search.substring(0, 12) + '...' : 
                activeFilters.search;
            createFilterChip('Busca: "' + displaySearch + '"', () => {
                searchInput.value = '';
                activeFilters.search = '';
                btnClearSearch.classList.add('hidden');
                applyFiltersAndRender();
            });
        }
    }

    function createFilterChip(text, onRemove) {
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.innerHTML = `
            <span>${text}</span>
            <button aria-label="Eliminar filtro"><i class="fa-solid fa-xmark"></i></button>
        `;
        chip.querySelector('button').addEventListener('click', onRemove);
        activeFiltersChips.appendChild(chip);
    }

    // Render structured results into HTML cards
    function renderReleases(releases) {
        releasesList.innerHTML = '';
        
        if (releases.length === 0) {
            releasesList.innerHTML = `
                <div class="feed-status-card">
                    <div class="status-icon" style="color: var(--text-muted);">
                        <i class="fa-solid fa-magnifying-glass-blur"></i>
                    </div>
                    <h2>Sin resultados</h2>
                    <p>No hay notas de versión que coincidan con los filtros aplicados. Prueba a cambiar los términos de búsqueda o los filtros de tipo.</p>
                </div>
            `;
            return;
        }

        releases.forEach(release => {
            const card = document.createElement('article');
            card.className = 'release-group-card animate-fade-in';
            
            // Format external link
            const externalLink = release.link || 'https://cloud.google.com/bigquery/docs/release-notes';

            let updatesHtml = '';
            release.updates.forEach(update => {
                const typeClass = update.type.toLowerCase().replace(/\s+/g, '-');
                const highlightedContent = highlightSearchText(update.content_html, activeFilters.search);
                
                updatesHtml += `
                    <div class="update-item">
                        <div class="update-item-header">
                            <span class="type-badge ${typeClass}">
                                <i class="fa-solid ${getIconForType(update.type)}"></i> ${update.type}
                            </span>
                            <div class="update-actions">
                                <button class="btn-share-twitter" 
                                    data-date="${release.date}" 
                                    data-type="${update.type}" 
                                    data-link="${externalLink}"
                                    data-text="${encodeURIComponent(update.content_text)}">
                                    <i class="fa-brands fa-x-twitter"></i> Compartir
                                </button>
                            </div>
                        </div>
                        <div class="update-description">
                            ${highlightedContent}
                        </div>
                    </div>
                `;
            });

            card.innerHTML = `
                <div class="release-group-header">
                    <div class="release-date">
                        <i class="fa-regular fa-calendar-check"></i>
                        <h2>${release.date}</h2>
                    </div>
                    <a href="${externalLink}" target="_blank" rel="noopener noreferrer" class="release-link" title="Ver en Google Cloud">
                        Ver notas <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
                <div class="release-group-content">
                    ${updatesHtml}
                </div>
            `;
            
            releasesList.appendChild(card);
        });

        // Add event listeners to newly rendered twitter buttons
        document.querySelectorAll('.btn-share-twitter').forEach(btn => {
            btn.addEventListener('click', openTwitterComposer);
        });
    }

    // Utility icons helper
    function getIconForType(type) {
        switch (type) {
            case 'Feature': return 'fa-wand-magic-sparkles';
            case 'Issue': return 'fa-circle-exclamation';
            case 'Changed': return 'fa-clock-rotate-left';
            case 'Deprecation': return 'fa-ban';
            default: return 'fa-circle-info';
        }
    }

    // Helper to highlight search keywords in content
    function highlightSearchText(html, search) {
        if (!search) return html;
        
        // Simple HTML-safe tag ignoring keyword highlighting
        // We match outside HTML tags using regex
        try {
            const regex = new RegExp(`(${escapeRegExp(search)})`, 'gi');
            // Parse HTML to text-nodes and wrap them, but for basic safety:
            // This replacement handles simple strings. A robust DOM replacement is better,
            // but since it's a feed from Google GCP, we can replace keywords safe from tag injections.
            // Let's create a temporary element, highlight text nodes only.
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            highlightNode(tempDiv, regex);
            return tempDiv.innerHTML;
        } catch (e) {
            return html;
        }
    }

    function highlightNode(node, regex) {
        if (node.nodeType === 3) { // Text node
            const matches = node.nodeValue.match(regex);
            if (matches) {
                const span = document.createElement('span');
                span.innerHTML = node.nodeValue.replace(regex, '<mark class="highlight">$1</mark>');
                node.parentNode.replaceChild(span, node);
            }
        } else if (node.nodeType === 1 && node.childNodes && !/(style|script|a)/i.test(node.tagName)) {
            // Don't highlight inside tags or links
            for (let i = node.childNodes.length - 1; i >= 0; i--) {
                highlightNode(node.childNodes[i], regex);
            }
        }
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Twitter Integration and Real-time Modal Composer
    function openTwitterComposer(e) {
        const btn = e.currentTarget;
        const date = btn.getAttribute('data-date');
        const type = btn.getAttribute('data-type');
        const link = btn.getAttribute('data-link');
        const rawText = decodeURIComponent(btn.getAttribute('data-text'));

        // Prepare pre-formatted Tweet with character limitation
        // Twitter counts links as 23 chars. Max tweet text size: 280.
        // Format: "⚡ BigQuery Release ({date}) - {type}:\n\n{rawText}\n\nMore: {link} #BigQuery #GoogleCloud"
        
        const header = `⚡ BigQuery (${date}) - ${type}:\n\n`;
        const footer = `\n\nMore: ${link} #BigQuery #GoogleCloud`;
        
        // Link counts as 23 characters in Twitter, hashtags and spacing take some room
        const twitterLinkLength = 23;
        const footerEstimateLength = 10 + twitterLinkLength + 25; // "\n\nMore: " + 23 + " #BigQuery #GoogleCloud"
        const allowedDescLength = 280 - header.length - footerEstimateLength;
        
        let displayDesc = rawText;
        if (rawText.length > allowedDescLength) {
            displayDesc = rawText.substring(0, allowedDescLength - 4) + '...';
        }
        
        const initialTweetText = `${header}${displayDesc}${footer}`;
        
        // Update Modal UI
        tweetTextarea.value = initialTweetText;
        linkCardTitle.textContent = `BigQuery Release - ${date}`;
        
        // Open Modal
        twitterModal.classList.add('active');
        twitterModal.setAttribute('aria-hidden', 'false');
        
        // Focus textarea and update counts
        setTimeout(() => {
            tweetTextarea.focus();
            updateCharCount();
        }, 100);
    }

    function closeTwitterModal() {
        twitterModal.classList.remove('active');
        twitterModal.setAttribute('aria-hidden', 'true');
    }

    function updateCharCount() {
        const text = tweetTextarea.value;
        const count = text.length;
        charCount.textContent = count;
        
        // Update circular progress ring
        // Circumference is 2 * PI * r (r=8) = ~50.26
        const circumference = 2 * Math.PI * 8;
        const maxChars = 280;
        
        let progress = count / maxChars;
        if (progress > 1) progress = 1;
        
        const strokeDashoffset = circumference - (progress * circumference);
        ringProgress.style.strokeDashoffset = strokeDashoffset;
        
        // Style changes based on length
        if (count > maxChars) {
            charCount.style.color = '#f87171'; // Red
            ringProgress.style.stroke = '#f87171';
            btnSendTweet.disabled = true;
            btnSendTweet.style.opacity = '0.5';
            btnSendTweet.style.cursor = 'not-allowed';
        } else if (count >= maxChars - 20) {
            charCount.style.color = '#fbbf24'; // Yellow
            ringProgress.style.stroke = '#fbbf24';
            btnSendTweet.disabled = false;
            btnSendTweet.style.opacity = '1';
            btnSendTweet.style.cursor = 'pointer';
        } else {
            charCount.style.color = 'var(--text-secondary)';
            ringProgress.style.stroke = 'var(--primary-color)';
            btnSendTweet.disabled = false;
            btnSendTweet.style.opacity = '1';
            btnSendTweet.style.cursor = 'pointer';
        }
    }
});
