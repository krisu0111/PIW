"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function GameDetails({ params }) {
    const [game, setGame] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [bidAmount, setBidAmount] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const fetchGame = async (id) => {
        try {
            const docRef = doc(db, "games", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setGame({ id: docSnap.id, ...docSnap.data() });
            } else {
                setGame(null);
            }
        } catch (error) {
            console.error("Błąd pobierania gry:", error);
        } finally {
            setIsLoading(false); 
        }
    };

    useEffect(() => {
        params.then((resolvedParams) => {
            fetchGame(resolvedParams.id);
        });
    }, [params]);

    const handleAddToCart = () => {
        const currentCart = JSON.parse(localStorage.getItem('cart')) || [];
        const isAlreadyInCart = currentCart.find(item => item.id === game.id);
        
        if (!isAlreadyInCart) {
            const newCart = [...currentCart, game];
            localStorage.setItem('cart', JSON.stringify(newCart));
            alert("Dodano do koszyka! Wróć na stronę główną, aby sfinalizować zakup.");
        } else {
            alert("Gra znajduje się już w Twoim koszyku.");
        }
    };

    const handleBid = async (e) => {
        e.preventDefault();
        if (!user) return alert("Brak autoryzacji");
        if (game.ownerId === user.uid) return alert("To twoja gra");

        const newBid = parseFloat(bidAmount);
        if (isNaN(newBid)) return alert("Błędna kwota");

        try {
            const docRef = doc(db, "games", game.id.toString());

            await runTransaction(db, async (transaction) => {
                const gameDoc = await transaction.get(docRef);
                if (!gameDoc.exists()) {
                    throw new Error("Gra nie istnieje w bazie");
                }

                const data = gameDoc.data();
                const currentHighest = data.highestBid 
                    || (data.auction ? data.auction.current_bid : null) 
                    || (data.auction ? data.auction.starting_price : data.price_pln);

                if (newBid <= currentHighest) {
                    throw new Error(`Błąd: Obecna najwyższa oferta to ${currentHighest} zł`);
                }

                transaction.update(docRef, { 
                    highestBid: newBid, 
                    highestBidderId: user.uid,
                    highestBidderEmail: user.email
                });
            });

            alert("Złożono ofertę");
            setBidAmount('');
            fetchGame(game.id);

        } catch (error) {
            console.error("Błąd licytacji:", error);
            alert(error.message);
            fetchGame(game.id); 
        }
    };

    const handleEndAuction = async () => {
        const isConfirmed = window.confirm("Czy zakończyć aukcję i sprzedać grę?");
        if (isConfirmed) {
            try {
                const docRef = doc(db, "games", game.id.toString());
                await updateDoc(docRef, { isSold: true });
                setGame({ ...game, isSold: true });
                alert("Aukcja zakończona");
            } catch (error) {
                console.error("Błąd zamykania aukcji:", error);
                alert("Błąd zamykania aukcji");
            }
        }
    };

    if (isLoading) {
        return <div style={{ padding: '20px' }}><h2>Ładowanie szczegółów gry</h2></div>;
    }

    if (!game) {
        return (
            <div style={{ padding: '20px' }}>
                <h2>Nie znaleziono takiej gry</h2>
                <Link href="/"><button>Wróć do sklepu</button></Link>
            </div>
        );
    }

    const currentPrice = game.highestBid 
        || (game.auction ? game.auction.current_bid : null) 
        || (game.auction ? game.auction.starting_price : game.price_pln);

    const canBuyNow = currentPrice < game.price_pln;
    const isAuctionActive = game.highestBid || game.auction;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/">
                <button style={{ marginBottom: '20px', padding: '5px 15px' }}>Wstecz</button>
            </Link>
            
            <h1>{game.title}</h1>
            
            {game.isSold && <h2 style={{ color: 'red'}}>SPRZEDANE</h2>}

            <p><b>Wydawnictwo:</b> {game.publisher}</p>
            <p><b>Cena Kup Teraz:</b> {game.price_pln} zł</p>
            <p><b>Ilość graczy:</b> {game.min_players} - {game.max_players}</p>
            
            <h3 style={{ marginTop: '20px' }}>Opis:</h3>
            <ul style={{ paddingLeft: '20px' }}>
                {game.description && game.description.map((line, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>{line}</li>
                ))}
            </ul>

            {!game.isSold && (
                <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc' }}>
                    <h3 style={{ marginBottom: '10px' }}>
                        Aktualna cena: <span style={{ fontWeight: 'bold' }}>{currentPrice} zł</span>
                    </h3>
                    
                    {game.highestBidderEmail && (
                        <p style={{ marginBottom: '15px' }}>Prowadzi: {game.highestBidderEmail}</p>
                    )}

                    {(!user || game.ownerId !== user.uid) && (
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                            {isAuctionActive && (
                                <form onSubmit={handleBid} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <label>Twoja oferta (zł):</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={bidAmount}
                                            onChange={(e) => setBidAmount(e.target.value)}
                                            style={{ padding: '5px' }}
                                            required
                                        />
                                        <button type="submit" style={{ padding: '5px 15px', cursor: 'pointer', background: '#e0e0e0', border: '1px solid #999', color: '#000' }}>
                                            Licytuj
                                        </button>
                                    </div>
                                </form>
                            )}

                            {canBuyNow && (
                                <button 
                                    onClick={handleAddToCart}
                                    style={{ padding: '6px 20px', cursor: 'pointer', background: '#555', color: '#fff', border: 'none', height: 'fit-content' }}
                                >
                                    Dodaj do koszyka ({game.price_pln} zł)
                                </button>
                            )}
                        </div>
                    )}

                    {user && game.ownerId === user.uid && (
                        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                            <p style={{ marginBottom: '10px' }}>Jesteś właścicielem tej oferty</p>
                            <button 
                                onClick={handleEndAuction}
                                style={{ padding: '5px 15px', cursor: 'pointer', background: '#333', color: '#fff', border: 'none' }}
                            >
                                Zakończ aukcję
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}