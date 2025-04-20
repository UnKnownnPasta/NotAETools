function init(data) {
	// DOM Elements
	const inventoryEl = document.getElementById("inventory");
	const themeToggle = document.getElementById("themeToggle");
	const loadButton = document.getElementById("loadButton");
	const loadingOverlay = document.getElementById("loadingOverlay");
	const resultsHeader = document.getElementById("resultsHeader");
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

	// Pagination state
	let currentPage = 1;
	const itemsPerPage = 30;
	let filteredItems = [];
	let dataLoaded = false;

	// Dark mode toggle
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

	// Sanitize user input to prevent XSS
	function sanitizeInput(input) {
		if (!input) return "";
		return input.replace(/[<>]/g, "");
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
		const fEdMin = Number(filters.edMin.value) || 0;
		const fRedMin = Number(filters.redMin.value) || 0;
		const fOrangeMin = Number(filters.orangeMin.value) || 0;
		const fYellowMin = Number(filters.yellowMin.value) || 0;
		const fGreenMin = Number(filters.greenMin.value) || 0;
		const fToken = Number(filters.token.value) || 0;

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
			emptyMessage.innerHTML = `
          <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
          <h3 style="margin-bottom: 0.5rem;">No items found</h3>
          <p>Try adjusting your filters or add some items to your inventory.</p>
        `;
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
				const colorClass = getColorClass(item.color);
				card.innerHTML = `
            <h4 class="${colorClass}">${item.item}</h4>
            <p><span>x2:</span> <span>${item.x2 ? "Yes" : "No"}</span></p>
            <p><span>Stock:</span> <span>${item.stock}</span></p>
            <p><span>Color:</span> <span class="${colorClass}">${
					item.color
				}</span></p>
            <p><span>Rarity:</span> <span>${getRarityName(
							item.rarity
						)}</span></p>
            <p><span>From:</span> <span style="overflow-y: auto; max-height: 120px; padding-left: 10px">${
							Array.isArray(item.relicFrom)
								? item.relicFrom.join(", ")
								: item.relicFrom
						}</span></p>
          `;
			} else {
				card.innerHTML = `
            <h4>${item.name}</h4>
            <p><span>Tokens:</span> <span>${item.tokens}</span></p>
            <p><span>Vaulted:</span> <span>${
							item.vaulted ? "Yes" : "No"
						}</span></p>
            <p><span>Kind:</span> <span>Relic</span></p>
          `;

				const tip = document.createElement("div");
				tip.className = "tooltip";

				item.rewards.forEach((r) => {
					const colorClass = getColorClass(r.color);
					const wr = document.createElement("div");
					wr.className = "reward";
					wr.innerHTML = `
              <span class="${colorClass}">${r.item}</span>
              <div>x2: ${r.x2 ? "Yes" : "No"}, stock: ${
						r.stock
					}, color: <span class="${colorClass}">${r.color}</span></div>
              <div>Rarity: ${getRarityName(r.rarity)}</div>
            `;
					tip.appendChild(wr);
				});

				card.appendChild(tip);
			}

			inventoryEl.appendChild(card);
		});

		// Position tooltips properly
		positionTooltips();
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
		if (dataLoaded) {
			filterItems();
		}
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

	// Load data with simulated delay
	function loadData() {
		loadingOverlay.style.display = "flex";

		// Simulate loading delay
		setTimeout(() => {
			dataLoaded = true;
			loadButton.style.display = "none";
			resultsHeader.style.display = "flex";
			loadingOverlay.style.display = "none";

			filterItems();
		}, 100);
	}

	// Event listeners
	loadButton.addEventListener("click", loadData);

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

	// Token preset buttons
	tokenPresets.forEach((button) => {
		button.addEventListener("click", () => {
			setTokenFilter(button.dataset.value);
		});
	});

	// Reset button
	resetButton.addEventListener("click", resetColorFilters);

	// Add event listeners to filters
	Object.values(filters).forEach((f) => {
		if (f && f.tagName) {
			f.addEventListener("input", () => {
				if (dataLoaded) {
					filterItems();
				}
			});
		}
	});

	// Add event listeners to rarity checkboxes
	filters.rarityFilters.forEach((checkbox) => {
		checkbox.addEventListener("change", () => {
			if (dataLoaded) {
				filterItems();
			}
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