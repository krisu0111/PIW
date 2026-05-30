"use client";
import { useState, useEffect, useReducer, useMemo } from 'react';
import Link from 'next/link';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, deleteDoc, query, limit, startAfter, orderBy, updateDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';

const cartReducer = (state, action) => {
    let newState;
    switch (action.type) {
        case 'ADD':
            if (state.find(item => item.id === action.payload.id)) return state;
            newState = [...state, action.payload];
            localStorage.setItem('cart', JSON.stringify(newState));
            return newState;
        case 'REMOVE':
            newState = state.filter(item => item.id !== action.payload);
            localStorage.setItem('cart', JSON.stringify(newState));
            return newState;
        case 'CLEAR':
            localStorage.removeItem('cart');
            return [];
        case 'INIT':
            return action.payload;
        default:
            return state;
    }
};

export default function Home() {
  const [games, setGames] = useState([]);
  const [filters, setFilters] = useState({
    word: '', price: '', type: '', players: '', publisher: ''
  });
  const [user, setUser] = useState(null);

  const [cart, dispatch] = useReducer(cartReducer, []);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const GAMES_PER_PAGE = 14; 
  const [pageCursors, setPageCursors] = useState([null]);
  const [isLastPage, setIsLastPage] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    dispatch({ type: 'INIT', payload: savedCart });
  }, []);

  const loadGamesPage = async (pageIndex) => {
    let q;
    if (pageIndex === 1 || !pageCursors[pageIndex - 1]) {
        q = query(collection(db, "games"), orderBy("title"), limit(GAMES_PER_PAGE));
    } else {
        q = query(collection(db, "games"), orderBy("title"), startAfter(pageCursors[pageIndex - 1]), limit(GAMES_PER_PAGE));
    }

    const querySnapshot = await getDocs(q);
    const gamesArray = [];
    querySnapshot.forEach((doc) => {
      gamesArray.push({ id: doc.id, ...doc.data() });
    });
    
    setGames(gamesArray);

    if (querySnapshot.docs.length < GAMES_PER_PAGE) {
        setIsLastPage(true);
    } else {
        setIsLastPage(false);
        const newCursors = [...pageCursors];
        newCursors[pageIndex] = querySnapshot.docs[querySnapshot.docs.length - 1];
        setPageCursors(newCursors);
    }
  };

  useEffect(() => {
    loadGamesPage(1);
  }, []);

  const handleNextPage = () => {
    const next = currentPage + 1;
    setCurrentPage(next);
    loadGamesPage(next);
  };

  const handlePrevPage = () => {
    const prev = currentPage - 1;
    setCurrentPage(prev);
    loadGamesPage(prev);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Błąd logowania");
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) {}
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

  const handleCheckout = async () => {
    if (!user) {
        alert("Musisz być zalogowany, aby dokonać zakupu.");
        return;
    }
    if (cart.length === 0) return;

    const isConfirmed = window.confirm(`Czy na pewno chcesz kupić ${cart.length} gry/gier?`);
    if (!isConfirmed) return;

    try {
        for (const item of cart) {
            const docRef = doc(db, "games", item.id.toString());
            await updateDoc(docRef, { 
                isSold: true, 
                buyerId: user.uid 
            });
        }
        
        alert("Zakup udany! Dziękujemy.");
        dispatch({ type: 'CLEAR' });
        setIsCartOpen(false);
        loadGamesPage(currentPage);
        
    } catch (error) {
        console.error("Błąd zakupu:", error);
        alert("Wystąpił błąd podczas finalizacji zakupu.");
    }
  };

  const currentGames = useMemo(() => {
    return games.filter((game) => {
      const matchWord = filters.word === '' || (game.description && game.description.join(' ').toLowerCase().includes(filters.word.toLowerCase()));
      const matchPrice = filters.price === '' || game.price_pln <= parseFloat(filters.price);
      const matchType = filters.type === '' || (game.type && game.type.toLowerCase() === filters.type.toLowerCase());
      const matchPlayers = filters.players === '' || (game.min_players <= parseInt(filters.players) && game.max_players >= parseInt(filters.players));
      const matchPublisher = filters.publisher === '' || (game.publisher && game.publisher.toLowerCase().includes(filters.publisher.toLowerCase()));
      return matchWord && matchPrice && matchType && matchPlayers && matchPublisher;
    });
  }, [games, filters]);

  const cartTotal = cart.reduce((sum, game) => sum + game.price_pln, 0);

  return (
    <>
      <header className="top" style={{ position: 'relative' }}>
        <h1>Durne Gierki</h1>
        <nav style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link href="/add">
            <button>Dodaj nową pozycję</button>
          </Link>
          
          <button onClick={() => setIsCartOpen(!isCartOpen)}>
            Koszyk ({cart.length})
          </button>
          
          {user ? (
            <>
              <span style={{ fontSize: '14px', color: '#555' }}>Witaj, {user.email}</span>
              <button onClick={handleLogout}>Wyloguj się</button>
            </>
          ) : (
            <>
              <button onClick={handleGoogleLogin}>Zaloguj przez Google</button>
              <Link href="/login"><button>Zaloguj się</button></Link>
            </>
          )}
        </nav>

        {isCartOpen && (
            <div style={{
                position: 'absolute', top: '60px', right: '10px', width: '250px',
                background: '#fff', border: '1px solid #000', padding: '10px', 
                zIndex: 1000, color: '#000'
            }}>
                <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #000', paddingBottom: '5px' }}>
                    Twój Koszyk
                </h3>
                
                {cart.length === 0 ? (
                    <p style={{ margin: 0 }}>Pusto</p>
                ) : (
                    <>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' }}>
                            {cart.map((item) => (
                                <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <span>{item.title}</span>
                                    <span>
                                        {item.price_pln} zł
                                        <button 
                                            onClick={() => dispatch({type: 'REMOVE', payload: item.id})}
                                            style={{ marginLeft: '5px' }}
                                        >
                                            X
                                        </button>
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <hr style={{ border: 'none', borderTop: '1px solid #000', margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <b>Suma:</b>
                            <b>{cartTotal.toFixed(2)} zł</b>
                        </div>
                        <button onClick={handleCheckout} style={{ width: '100%', padding: '5px' }}>
                            Kup zawartość
                        </button>
                    </>
                )}
            </div>
        )}
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
              currentGames.map((game) => {
                const currentPrice = game.highestBid 
                    || (game.auction ? game.auction.current_bid : null) 
                    || (game.auction ? game.auction.starting_price : game.price_pln);
                
                const canBuyNow = currentPrice < game.price_pln;

                return (
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
                      
                      {!game.isSold && canBuyNow && (
                        <button onClick={() => dispatch({type: 'ADD', payload: game})}>Do koszyka</button>
                      )}

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
                );
              })
            )}
          </main>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '20px' }}>
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{ padding: '8px 15px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Poprzednia
            </button>
            <span style={{ fontWeight: 'bold' }}>Strona {currentPage}</span>
            <button 
              onClick={handleNextPage}
              disabled={isLastPage}
              style={{ padding: '8px 15px', cursor: isLastPage ? 'not-allowed' : 'pointer' }}
            >
              Następna
            </button>
          </div>
        </div>
      </div>
    </>
  );
}