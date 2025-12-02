const resultsContainer = document.getElementById('cardResults');
const searchInput = document.getElementById('searchInput');
const API_BASE = 'https://api.eu2.tcgdex.net/v2/en/cards';
let allCards = [];

function isDashId(term) {
	return /^[a-z0-9]+-[^\s\/]+$/i.test(term.trim());
}

function isNumeric(term) {
	return /^\d+$/.test(term.trim());
}


async function fetchJson(url) {
	//console.log('API Request:', url);
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const json = await res.json();
	//console.log('API Response from', url, ':', json);
	return json;
}

async function searchCards() {
	const termRaw = (searchInput?.value || '').trim();
	if (!termRaw) {
		resultsContainer.innerHTML = '<p class="error-message">Por favor, digite um nome ou ID para buscar!</p>';
		return;
	}

	resultsContainer.innerHTML = '<p class="loading-message">A Carregar Resultados...</p>';

	try {
	
		if (allCards.length === 0) {
			const json = await fetchJson(API_BASE);
			
			allCards = Array.isArray(json) ? json : (json.results || json.data || []);
			//console.log('All cards from endpoint:', allCards);
		}

	
		const term = termRaw.toLowerCase();
		const found = allCards.filter(card => {
			const name = (card.name || '').toLowerCase();
			const id = (card.id || '').toLowerCase();
			const localId = (card.localId || '').toLowerCase();
			return name.includes(term) || id === term || id.includes(term) || localId === term;
		});

		//console.log('Cards to display:', found);
		if (!found || found.length === 0) {
			resultsContainer.innerHTML = `<p class="initial-message">Nenhuma carta foi encontrada para "${termRaw}".</p>`;
			return;
		}

		displayCards(found);
	} catch (err) {
		console.error('Search failed', err);
		resultsContainer.innerHTML = `<p class="error-message">Erro ao procurar : ${err.message}</p>`;
	}
}

async function displayCards(cards) {
	resultsContainer.innerHTML = '';
	if (!cards || (Array.isArray(cards) && cards.length === 0)) {
		resultsContainer.innerHTML = '<p class="initial-message">Nenhuma carta foi encontrada.</p>';
		return;
	}

	
	for (const card of cards) {
		const div = document.createElement('div');
		div.className = 'card-item';

		const apiId = card.id || 'N/A';
		const name = card.name || 'N/A';
		
		
		const imageUrl = card.image ? `${card.image}/low.webp` : null;
		const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="${name}" />` : '';

		
		div.innerHTML = `
			${imageHtml}
			<h3>${name}</h3>
			<p><strong>ID:</strong> ${apiId}</p>
			<p><strong>Type(s):</strong> <span class="types-placeholder">Carregando...</span></p>
			<p><strong>Artist:</strong> <span class="artist-placeholder">Carregando...</span></p>
		`;

		resultsContainer.appendChild(div);

		
		try {
			const detailUrl = `https://api.eu2.tcgdex.net/v2/en/cards/${apiId}`;
			const cardDetail = await fetchJson(detailUrl);

			
			const types = Array.isArray(cardDetail.types) && cardDetail.types.length ? cardDetail.types.join(', ') : 'N/A';
			const artist = cardDetail.illustrator || 'N/A';

		
			const typesSpan = div.querySelector('.types-placeholder');
			const artistSpan = div.querySelector('.artist-placeholder');
			if (typesSpan) typesSpan.textContent = types;
			if (artistSpan) artistSpan.textContent = artist;
		} catch (err) {
			console.error(`Failed to fetch details for ${apiId}:`, err);
			
			const typesSpan = div.querySelector('.types-placeholder');
			const artistSpan = div.querySelector('.artist-placeholder');
			if (typesSpan) typesSpan.textContent = 'N/A';
			if (artistSpan) artistSpan.textContent = 'N/A';
		}
	}
}

if (searchInput) {
	searchInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') searchCards();
	});
}

window.searchCards = searchCards;


