"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function AddGame() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        publisher: '',
        startingPrice: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                alert("Musisz być zalogowany żeby dodać nową grę");
                router.push('/login');
            } else {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!user) {
            alert("Brak autoryzacji uzytkownika");
            return;
        }
        
        try {
            const auctionData = formData.startingPrice ? {
                starting_price: parseFloat(formData.startingPrice),
                current_bid: parseFloat(formData.startingPrice),
                highest_bidder_uid: null
            } : null;

            const newGame = {
                title: formData.title,
                description: formData.description.split('\n'), 
                price_pln: parseFloat(formData.price),
                publisher: formData.publisher,
                min_players: 2, 
                max_players: 4, 
                type: "nieokreślony",
                isSold: false,
                ownerId: user.uid,
                auction: auctionData
            };

            await addDoc(collection(db, "games"), newGame);
            
            alert("Gra została pomyślnie dodana");
            router.push('/');
        } catch (error) {
            console.error("Błąd dodawania gry:", error);
            alert("Błąd przy zapisie");
        }
    };

    return (
        <>
        <header className="top">
            <h1>Durne Gierki</h1>
            <nav style={{ display: 'flex', gap: '10px' }}>
            <Link href="/">
                <button>Wstecz</button>
            </Link>
            </nav>
        </header>

        <div className="main-container">
            <main style={{ padding: '20px', margin: '0 auto', width: '100%', maxWidth: '500px' }}>
            <h2 style={{ paddingBottom: '10px' }}>Dodaj nową grę planszową</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label>
                Nazwa gry: 
                <input 
                    type="text" 
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                    style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                />
                </label>
                
                <label style={{ display: 'flex', flexDirection: 'column' }}>
                Opis szczegółowy: 
                <textarea 
                    rows="5" 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    style={{ padding: '5px', marginTop: '5px' }}
                ></textarea>
                </label>
                
                <label>
                Cena: 
                <input 
                    type="number" 
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    required 
                    style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                />
                </label>

                <label>
                Cena wywoławcza licytacji (opcjonalnie): 
                <input 
                    type="number" 
                    step="0.01"
                    value={formData.startingPrice}
                    onChange={e => setFormData({...formData, startingPrice: e.target.value})} 
                    style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                />
                </label>
                
                <label>
                Wydawnictwo: 
                <input 
                    type="text" 
                    value={formData.publisher}
                    onChange={e => setFormData({...formData, publisher: e.target.value})} 
                    style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                />
                </label>
                
                <button type="submit" style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}>
                Zapisz pozycję
                </button>
            </form>
            </main>
        </div>
        </>
    );
}