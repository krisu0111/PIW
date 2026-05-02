"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import gamesData from '../data/gierki.json';

export default function Home() {
	const [games, setGames] = useState([]);
	const [filters, setFilters] = useState({
		word: '',
		price: '',
		type: '',
		players: '',
		publisher: ''
	});

	useEffect(() => {
		const localDB = localStorage.getItem('durneGierkiDB');
		if (localDB) {
		setGames(JSON.parse(localDB));
		} else {
		setGames(gamesData.board_games);
		localStorage.setItem('durneGierkiDB', JSON.stringify(gamesData.board_games));
		}
	}, []);

	const handleFilterChange = (e) => {
		const { name, value } = e.target;
		setFilters({ ...filters, [name]: value });
	};

	const handleDelete = (id) => {
		const isConfirmed = window.confirm("Czy na pewno usunąć tę grę?");
		
		if (isConfirmed) {
		const updatedGames = games.filter((game) => game.id !== id);
		
		setGames(updatedGames);
		
		localStorage.setItem('durneGierkiDB', JSON.stringify(updatedGames));
		}
	};

	const filteredGames = games.filter((game) => {
		const matchWord = filters.word === '' || (game.description && game.description.join(' ').toLowerCase().includes(filters.word.toLowerCase()));
		const matchPrice = filters.price === '' || game.price_pln <= parseFloat(filters.price);
		const matchType = filters.type === '' || (game.type && game.type.toLowerCase() === filters.type.toLowerCase());
		const matchPlayers = filters.players === '' || (game.min_players <= parseInt(filters.players) && game.max_players >= parseInt(filters.players));
		const matchPublisher = filters.publisher === '' || (game.publisher && game.publisher.toLowerCase().includes(filters.publisher.toLowerCase()));

		return matchWord && matchPrice && matchType && matchPlayers && matchPublisher;
	});

	return (
		<>
		<header className="top">
			<h1>Durne Gierki</h1>
			<nav style={{ display: 'flex', gap: '10px' }}>
			<Link href="/add">
				<button>Dodaj nową pozycję</button>
			</Link>
			<button>Koszyk</button>
			<button>Zaloguj się</button>
			<button>Wyloguj się</button>
			</nav>
		</header>

		<div className="main-container">
			<aside className="filters">
			<label>Słowo w opisie: <input name="word" type="text" onChange={handleFilterChange} /></label>
			<label>Cena do [zł]: <input name="price" type="number" onChange={handleFilterChange} /></label>
			<label>Rodzaj: 
				<select name="type" onChange={handleFilterChange}>
				<option value="">Wszystkie</option>
				<option value="ekonomiczna">Ekonomiczna</option>
				<option value="imprezowa">Imprezowa</option>
				<option value="strategiczna">Strategiczna</option>
				</select>
			</label>
			<label>Ilość graczy: <input name="players" type="number" onChange={handleFilterChange} /></label>
			<label>Wydawnictwo: <input name="publisher" type="text" onChange={handleFilterChange} /></label>
			</aside>

			<main className="product-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', padding: '20px' }}>
			{filteredGames.map((game) => (
				<article key={game.id} className="product-card" style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
				<h3>{game.title}</h3>
				<p>Wydawnictwo: {game.publisher}</p>
				<p><b>Cena: {game.price_pln} zł</b></p>
				
				<div style={{ marginTop: 'auto', paddingTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
					<Link href={`/game/${game.id}`}>
					<button>Szczegóły</button>
					</Link>
					<Link href={`/edit/${game.id}`}>
					<button>Edytuj</button>
					</Link>
					<button onClick={() => handleDelete(game.id)}>
					Usuń
					</button>
				</div>
				</article>
			))}
			</main>
		</div>
		</>
	);
}