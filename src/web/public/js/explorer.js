function init(data) {
	// DOM Elements
	const inventoryEl = document.getElementById("inventory");
	const themeToggle = document.getElementById("themeToggle");
	const currentCountEl = document.getElementById("currentCount");
	const totalCountEl = document.getElementById("totalCount");
	const currentPageEl = document.getElementById("currentPage");
	const totalPagesEl = document.getElementById("totalPages");
	const resetButton = document.getElementById("resetButton");
	const prevButton = document.getElementById("prevButton");
	const nextButton = document.getElementById("nextButton");
	const tokenFilter = document.getElementById("tokenFilter");
	const tokenPresets = document.querySelectorAll(".token-preset");

	// Filters
	const filters = {
		type: document.getElementById("typeFilter"),
		vaultedFilter: document.getElementById("vaultedFilter"),
		name: document.getElementById("nameSearch"),
		x2Filter: document.getElementById("x2Filter"),
		edMin: document.getElementById("edMinFilter"),
		redMin: document.getElementById("redMinFilter"),
		orangeMin: document.getElementById("orangeMinFilter"),
		yellowMin: document.getElementById("yellowMinFilter"),
		greenMin: document.getElementById("greenMinFilter"),
		token: document.getElementById("tokenFilter"),
		rarityFilters: document.querySelectorAll(".rarity-filter"),
	};

	function alignTimelineDots() {
		const rail = document.querySelector('.js-timeline-rail');
		const explorerTitle = document.querySelector('.section-explorer .ae-timeline-title-row');
		const resultsTitle = document.querySelector('.section-results .ae-timeline-title-row');
		const dotExplorer = document.querySelector('.dot-explorer');
		const dotResults = document.querySelector('.dot-results');
		const lineExplorerResults = document.querySelector('.line-explorer-results');
		const lineResultsFooter = document.querySelector('.line-results-footer');
		const footer = document.querySelector('.ae-footer');
		const dotFooter = document.querySelector('.dot-footer');

		if (rail && explorerTitle && resultsTitle && dotExplorer && dotResults && lineExplorerResults && lineResultsFooter && footer) {
			// Get positions relative to the rail
			const railRect = rail.getBoundingClientRect();
			const explorerRect = explorerTitle.getBoundingClientRect();
			const resultsRect = resultsTitle.getBoundingClientRect();
			const footerRect = footer.getBoundingClientRect();

			// Calculate center positions
			const explorerCenter = explorerRect.top + explorerRect.height / 2 - railRect.top;
			const resultsCenter = resultsRect.top + resultsRect.height / 2 - railRect.top;

			// Position dots
			dotExplorer.style.top = `${explorerCenter - 9}px`;
			dotResults.style.top = `${resultsCenter - 9}px`;

			// Position line between dots
			lineExplorerResults.style.top = `${explorerCenter + 9}px`;
			lineExplorerResults.style.height = `${resultsCenter - explorerCenter - 18}px`;

			// Position line from results dot to footer
			const dotBottom = resultsCenter + 9; // bottom of the dot
			const footerTop = footerRect.top - railRect.top;
			const lineHeight = Math.max(0, footerTop - dotBottom);

			lineResultsFooter.style.top = `${dotBottom}px`;
			lineResultsFooter.style.height = `${lineHeight - 20}px`;
			dotFooter.style.top = `${lineHeight + dotBottom - 20}px`;
		}
	}

	window.addEventListener('load', alignTimelineDots);
	window.addEventListener('resize', alignTimelineDots);

	// Use ResizeObserver for dynamic layout changes
	window.__aeTimelineResizeObserver = window.__aeTimelineResizeObserver || null;
	function setupTimelineResizeObserver() {
		if (window.ResizeObserver && !window.__aeTimelineResizeObserver) {
			const rail = document.querySelector('.js-timeline-rail');
			const footer = document.querySelector('.ae-footer');
			window.__aeTimelineResizeObserver = new ResizeObserver(alignTimelineDots);
			if (rail) window.__aeTimelineResizeObserver.observe(rail);
			if (footer) window.__aeTimelineResizeObserver.observe(footer);
			window.__aeTimelineResizeObserver.observe(document.body);
		}
	}
	setupTimelineResizeObserver();

	// Pagination state
	let currentPage = 1;
	const itemsPerPage = 30;
	let filteredItems = [];

	// Dark mode toggle
	if (themeToggle) {
		themeToggle.addEventListener("change", function () {
			if (this.checked) {
				document.documentElement.setAttribute("data-theme", "dark");
				localStorage.setItem("theme", "dark");
			} else {
				document.documentElement.removeAttribute("data-theme");
				localStorage.setItem("theme", "light");
			}
		});
		// Check for saved theme preference
		const savedTheme = localStorage.getItem("theme");
		if (savedTheme === "dark") {
			document.documentElement.setAttribute("data-theme", "dark");
			themeToggle.checked = true;
		}
	}

	// Get color class for styling
	function getColorClass(color) {
		if (!color) return "";
		const colorLower = color.toLowerCase();
		if (colorLower === "ed") return "text-ed";
		if (colorLower === "red") return "text-red";
		if (colorLower === "orange") return "text-orange";
		if (colorLower === "yellow") return "text-yellow";
		if (colorLower === "green") return "text-green";
		return "";
	}

	// Check if a relic has any x2 rewards
	function hasX2Rewards(item) {
		if (item._kind === "primes") {
			return item.x2;
		} else {
			return item.rewards.some((r) => r.x2);
		}
	}

	// Get selected rarity filters for a color
	function getSelectedRarities(color) {
		const selected = [];
		filters.rarityFilters.forEach((checkbox) => {
			if (
				checkbox.checked &&
				checkbox.dataset.color.toLowerCase() === color.toLowerCase()
			) {
				selected.push(parseFloat(checkbox.dataset.rarity));
			}
		});
		return selected;
	}

	// Check if a reward matches the rarity filter
	function matchesRarityFilter(reward, color) {
		const selectedRarities = getSelectedRarities(color);
		if (selectedRarities.length === 0) return true; // No rarity filter selected
		return selectedRarities.includes(reward.rarity);
	}

	// Enhanced sanitizeInput function to prevent XSS and limit length
	function sanitizeInput(input, maxLength = 100) {
		if (!input) return "";
		const div = document.createElement('div');
		div.textContent = input;
		return div.textContent.slice(0, maxLength);
	}

	// Sanitize HTML content
	function sanitizeHTML(html) {
		const div = document.createElement('div');
		div.textContent = html;
		return div.textContent;
	}

	// Validate numeric input with length limit
	function validateNumericInput(value, min = 0, max = Infinity, maxLength = 10) {
		const strValue = String(value).slice(0, maxLength);
		const num = Number(strValue);
		if (isNaN(num)) return min;
		return Math.min(Math.max(num, min), max);
	}

	// Validate color input
	function validateColor(color) {
		const validColors = ['ed', 'red', 'orange', 'yellow', 'green'];
		return validColors.includes(color.toLowerCase()) ? color.toLowerCase() : '';
	}

	// Validate rarity input
	function validateRarity(rarity) {
		const validRarities = [2, 11, 25.33];
		return validRarities.includes(Number(rarity)) ? Number(rarity) : null;
	}

	// Update pagination UI
	function updatePagination() {
		const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

		currentPageEl.textContent = currentPage;
		totalPagesEl.textContent = totalPages;
		totalCountEl.textContent = filteredItems.length;

		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = Math.min(startIndex + itemsPerPage, filteredItems.length);
		currentCountEl.textContent = `${startIndex + 1}-${endIndex}`;

		prevButton.disabled = currentPage === 1;
		nextButton.disabled = currentPage === totalPages;
	}

	// Filter and render items
	function filterItems() {
		const fName = sanitizeInput(filters.name.value.toLowerCase());
		const fType = filters.type.value;
		const fVault = filters.vaultedFilter.value;
		const fX2 = filters.x2Filter.value;
		const fEdMin = validateNumericInput(filters.edMin.value, 0, 10);
		const fRedMin = validateNumericInput(filters.redMin.value, 0, 10);
		const fOrangeMin = validateNumericInput(filters.orangeMin.value, 0, 10);
		const fYellowMin = validateNumericInput(filters.yellowMin.value, 0, 10);
		const fGreenMin = validateNumericInput(filters.greenMin.value, 0, 10);
		const fToken = validateNumericInput(filters.token.value, 0);

		let list = [];

		if (fType === "all" || fType === "relics")
			list.push(...data.relics.map((r) => ({ ...r, _kind: "relics" })));

		if (fType === "all" || fType === "primes")
			list.push(...data.primes.map((p) => ({ ...p, _kind: "primes" })));

		filteredItems = list.filter((item) => {
			// Token filter (only for relics)
			if (item._kind === "relics" && fToken > 0 && item.tokens < fToken)
				return false;

			// vaulted filter (only for relics)
			if (
				item._kind === "relics" &&
				fVault !== "all" &&
				String(item.vaulted) !== fVault
			)
				return false;

			// name search
			if (fName) {
				const txt = item._kind === "primes" ? item.item : item.name;
				if (!txt.toLowerCase().includes(fName)) return false;
			}

			// x2 filter - check if item has any x2 rewards
			if (fX2 !== "all") {
				const hasX2 = hasX2Rewards(item);
				if (String(hasX2) !== fX2) return false;
			}

			// Color filters with rarity (only for relics)
			if (item._kind === "relics") {
				const colorFilters = {
					ed: fEdMin,
					red: fRedMin,
					orange: fOrangeMin,
					yellow: fYellowMin,
					green: fGreenMin
				};
				
				for (const [color, min] of Object.entries(colorFilters)) {
					const selectedRarities = getSelectedRarities(color);
					const matchingRewardsRarity = item.rewards.filter(
						r => r.color.toLowerCase() === color && matchesRarityFilter(r, color)
					);

					const matchingRewards = item.rewards.filter(
						r => r.color.toLowerCase() === color
					);

					if (min > 0) {
						if (matchingRewards.length < min) return false;
					} 
					if (selectedRarities.length > 0) {
						if (matchingRewardsRarity.length === 0) return false;
					}
				}				
			}

			// Color filters for primes
			if (item._kind === "primes") {
				const color = item.color.toLowerCase();

				const minFilters = {
					ed: fEdMin,
					red: fRedMin,
					orange: fOrangeMin,
					yellow: fYellowMin,
					green: fGreenMin
				};
				
				// If any filter is active, and the item's color is not in the filtered set, reject it
				const anyFilterActive = Object.values(minFilters).some(val => val > 0);
				if (anyFilterActive && !(color in minFilters)) {
					return false;
				}
				
				// If the item's color has an active filter, check rarity match
				if (color in minFilters && minFilters[color] > 0) {
					const selectedRarities = getSelectedRarities(color);
					if (selectedRarities.length > 0 && !selectedRarities.includes(item.rarity)) {
						return false;
					}
					return true;
				}
				
				// If no filters, or color has no min filter, let it through
				return !anyFilterActive;				
			}

			return true;
		});

		currentPage = 1;
		updatePagination();
		renderItems();
	}

	// Render items for current page
	function renderItems() {
		inventoryEl.innerHTML = "";

		if (filteredItems.length === 0) {
			const emptyMessage = document.createElement("div");
			emptyMessage.className = "empty-message";
			emptyMessage.style.gridColumn = "1 / -1";
			emptyMessage.style.textAlign = "center";
			emptyMessage.style.padding = "3rem";
			emptyMessage.style.color = "var(--text-secondary)";
			emptyMessage.innerHTML = sanitizeHTML(`
				<div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
				<h3 style="margin-bottom: 0.5rem;">No items found</h3>
				<p>Try adjusting your filters or add some items to your inventory.</p>
			`);
			inventoryEl.appendChild(emptyMessage);
			return;
		}

		const startIndex = (currentPage - 1) * itemsPerPage;
		const endIndex = Math.min(startIndex + itemsPerPage, filteredItems.length);
		const currentItems = filteredItems.slice(startIndex, endIndex);

		// Render items
		currentItems.forEach((item) => {
			const card = document.createElement("div");
			card.className = "item";

			if (item._kind === "primes") {
				// More compact prime item display
				const colorClass = getColorClass(validateColor(item.color));
				const itemName = sanitizeHTML(item.item);
				const relicFrom = Array.isArray(item.relicFrom) 
					? item.relicFrom.map(sanitizeHTML).join(", ")
					: sanitizeHTML(item.relicFrom);

				card.innerHTML = sanitizeHTML(`
					<h4 class="${colorClass}">${itemName}</h4>
					<p><span>x2:</span> <span>${item.x2 ? "Yes" : "No"}</span></p>
					<p><span>Stock:</span> <span>${validateNumericInput(item.stock)}</span></p>
					<p><span>Color:</span> <span class="${colorClass}">${validateColor(item.color)}</span></p>
					<p><span>Rarity:</span> <span>${getRarityName(validateRarity(item.rarity))}</span></p>
					<p><span>From:</span> <span style="overflow-y: auto; max-height: 120px; padding-left: 10px">${relicFrom}</span></p>
				`);
			} else {
				const itemName = sanitizeHTML(item.name);
				card.innerHTML = sanitizeHTML(`
					<h4>${itemName}</h4>
					<p><span>Tokens:</span> <span>${validateNumericInput(item.tokens)}</span></p>
					<p><span>Vaulted:</span> <span>${item.vaulted ? "Yes" : "No"}</span></p>
					<p><span>Kind:</span> <span>Relic</span></p>
				`);

				const tip = document.createElement("div");
				tip.className = "tooltip";

				item.rewards.forEach((r) => {
					const colorClass = getColorClass(validateColor(r.color));
					const rewardName = sanitizeHTML(r.item);
					const wr = document.createElement("div");
					wr.className = "reward";
					wr.innerHTML = sanitizeHTML(`
						<span class="${colorClass}">${rewardName}</span>
						<div>x2: ${r.x2 ? "Yes" : "No"}, stock: ${validateNumericInput(r.stock)}, color: <span class="${colorClass}">${validateColor(r.color)}</span></div>
						<div>Rarity: ${getRarityName(validateRarity(r.rarity))}</div>
					`);
					tip.appendChild(wr);
				});

				card.appendChild(tip);
			}

			inventoryEl.appendChild(card);
		});

		// Position tooltips properly
		positionTooltips();
		alignTimelineDots();
	}

	// Convert rarity value to name
	function getRarityName(rarity) {
		if (rarity === 2) return "RARE";
		if (rarity === 11) return "UNCOMMON";
		if (rarity === 25.33) return "COMMON";
		return rarity;
	}

	// Position tooltips to prevent overlap and ensure they're visible
	function positionTooltips() {
		document.querySelectorAll(".item").forEach((item) => {
			const tooltip = item.querySelector(".tooltip");
			if (!tooltip) return;

			// Always position tooltips above items to prevent overlap
			tooltip.style.top = "auto";
			tooltip.style.bottom = "100%";

			// Add event listener to adjust tooltip position when hovering
			item.addEventListener("mouseenter", () => {
				// Get viewport dimensions
				const viewportWidth = window.innerWidth;
				const viewportHeight = window.innerHeight;

				// Get tooltip and item dimensions and positions
				const tooltipRect = tooltip.getBoundingClientRect();
				const itemRect = item.getBoundingClientRect();

				// Check if tooltip would go off the left or right of the screen
				if (tooltipRect.left < 0) {
					tooltip.style.left = "0";
					tooltip.style.right = "auto";
				} else if (tooltipRect.right > viewportWidth) {
					tooltip.style.left = "auto";
					tooltip.style.right = "0";
				}

				// Calculate available space above and below
				const spaceAbove = itemRect.top;
				const spaceBelow = viewportHeight - itemRect.bottom;

				// Set max height based on available space
				if (spaceAbove < 300 && spaceBelow > spaceAbove) {
					// If more space below, show tooltip below
					tooltip.style.top = "100%";
					tooltip.style.bottom = "auto";
					tooltip.style.maxHeight = `${Math.min(300, spaceBelow - 10)}px`;
				} else {
					// Otherwise show above
					tooltip.style.top = "auto";
					tooltip.style.bottom = "100%";
					tooltip.style.maxHeight = `${Math.min(300, spaceAbove - 10)}px`;
				}
			});
		});
	}

	// Set token filter from preset
	function setTokenFilter(value) {
		tokenFilter.value = value;
		filterItems();
	}

	function resetColorFilters() {
		// Reset min values
		filters.edMin.value = 0;
		filters.redMin.value = 0;
		filters.orangeMin.value = 0;
		filters.yellowMin.value = 0;
		filters.greenMin.value = 0;
	
		// Uncheck all rarity checkboxes
		filters.rarityFilters.forEach(cb => cb.checked = false);
	
		// Re-apply filter
		filterItems();
	}

	// Filter and render items immediately
	filterItems();

	// Pagination and filter event listeners
	prevButton.addEventListener("click", () => {
		if (currentPage > 1) {
			currentPage--;
			updatePagination();
			renderItems();
			window.scrollTo(0, 0);
		}
	});

	nextButton.addEventListener("click", () => {
		const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
		if (currentPage < totalPages) {
			currentPage++;
			updatePagination();
			renderItems();
			window.scrollTo(0, 0);
		}
	});

	tokenPresets.forEach((button) => {
		button.addEventListener("click", () => {
			setTokenFilter(button.dataset.value);
		});
	});

	resetButton.addEventListener("click", resetColorFilters);

	Object.values(filters).forEach((f) => {
		if (f && f.tagName) {
			f.addEventListener("input", () => {
				filterItems();
			});
		}
	});

	filters.rarityFilters.forEach((checkbox) => {
		checkbox.addEventListener("change", () => {
			filterItems();
		});
	});

	// Handle window resize to reposition tooltips
	window.addEventListener("resize", positionTooltips);
}

;(async () => {
	const res = await fetch('/api/explorer', {method: 'GET'});
	const data = await res.json();
	init(data);
})();