"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [games, setGames] = useState([]);
  const [filters, setFilters] = useState({
    word: '', price: '', type: '', players: '', publisher: ''
  });
  const [user, setUser] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const GAMES_PER_PAGE = 14;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchGames = async () => {
      const querySnapshot = await getDocs(collection(db, "games"));
      const gamesArray = [];
      querySnapshot.forEach((doc) => {
        gamesArray.push({ id: doc.id, ...doc.data() });
      });
      setGames(gamesArray);
    };
    fetchGames();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Błąd logowania Google:", error);
      alert("Błąd logowania");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Błąd wylogowywania:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm("Czy na pewno chcesz usunąć tę grę?");
    if (isConfirmed) {
      await deleteDoc(doc(db, "games", id.toString()));
      setGames(games.filter((game) => game.id.toString() !== id.toString()));
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

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const currentGames = filteredGames.slice(
    (currentPage - 1) * GAMES_PER_PAGE,
    currentPage * GAMES_PER_PAGE
  );

  return (
    <>
      <header className="top">
        <h1>Durne Gierki</h1>
        <nav style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/add">
            <button>Dodaj nową pozycję</button>
          </Link>
          <button>Koszyk</button>
          
          {user ? (
            <>
              <span style={{ fontSize: '14px', color: '#555' }}>Witaj, {user.email}</span>
              <button onClick={handleLogout}>Wyloguj się</button>
            </>
          ) : (
            <>
              <button onClick={handleGoogleLogin}>
                Zaloguj przez Google
              </button>
              <Link href="/login">
                <button>Zaloguj się</button>
              </Link>
            </>
          )}
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

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <main className="product-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', padding: '20px' }}>
            {currentGames.length === 0 ? (
              <p>Ładowanie z chmury lub brak gier spełniających kryteria.</p>
            ) : (
              currentGames.map((game) => (
                <article 
                  key={game.id} 
                  className="product-card" 
                  style={{ 
                    border: '1px solid #ddd', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    opacity: game.isSold ? 0.6 : 1,
                    backgroundColor: game.isSold ? '#f5f5f5' : 'white',
                    filter: game.isSold ? 'grayscale(100%)' : 'none'
                  }}
                >
                  <h3>{game.title} {game.isSold && <span style={{color: 'red'}}>(SPRZEDANE)</span>}</h3>
                  <p>Wydawnictwo: {game.publisher}</p>
                  <p><b>Cena: {game.price_pln} zł</b></p>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Link href={`/game/${game.id}`}>
                      <button>Szczegóły</button>
                    </Link>
                    {user && game.ownerId === user.uid && (
                      <>
                        {!game.isSold && (
                          <Link href={`/edit/${game.id}`}>
                            <button>Edytuj</button>
                          </Link>
                        )}
                        <button onClick={() => handleDelete(game.id)}>Usuń</button>
                      </>
                    )}
                  </div>
                </article>
              ))
            )}
          </main>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '20px' }}>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 15px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Poprzednia
              </button>
              
              <span style={{ fontWeight: 'bold' }}>
                Strona {currentPage} z {totalPages}
              </span>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 15px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Następna
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}