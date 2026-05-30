"use client";
import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { db, auth } from '../../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function EditGame({ params }) {
    const resolvedParams = use(params); 
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        title: '', price: '', publisher: ''
    });
    const [isLoading, setIsLoading] = useState(true);

    const descriptionRef = useRef(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                alert("Musisz być zalogowany żeby edytować gry");
                router.push('/login');
                return;
            }

            try {
                const docRef = doc(db, "games", resolvedParams.id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const gameToEdit = docSnap.data();
                    
                    if (gameToEdit.ownerId !== currentUser.uid) {
                        alert("Możesz edytować tylko SWOJE gry (dodane przez ciebie)");
                        router.push('/');
                        return;
                    }

                    setFormData({
                        title: gameToEdit.title || '',
                        price: gameToEdit.price_pln || '',
                        publisher: gameToEdit.publisher || ''
                    });

                    if (descriptionRef.current) {
                        descriptionRef.current.value = gameToEdit.description ? gameToEdit.description.join('\n') : '';
                    }

                } else {
                    alert("Nie znaleziono gry w bazie");
                    router.push('/');
                }
            } catch (error) {
                console.error("Błąd pobierania danych:", error);
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [resolvedParams.id, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const docRef = doc(db, "games", resolvedParams.id);
            
            await updateDoc(docRef, {
                title: formData.title,
                description: descriptionRef.current.value.split('\n'),
                price_pln: parseFloat(formData.price),
                publisher: formData.publisher
            });
            
            alert("Gra została zaktualizowana");
            router.push('/');
        } catch (error) {
            console.error("Błąd aktualizacji gry:", error);
            alert("Błąd przy zapisie");
        }
    };

    if (isLoading) {
        return <div style={{ padding: '20px' }}>Ładowanie danych</div>;
    }

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
            <h2 style={{ paddingBottom: '10px' }}>Edytuj pozycję</h2>
            
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
                    ref={descriptionRef}
                    rows="5" 
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
                Wydawnictwo: 
                <input 
                    type="text" 
                    value={formData.publisher}
                    onChange={e => setFormData({...formData, publisher: e.target.value})} 
                    style={{ width: '100%', padding: '5px', marginTop: '5px' }}
                />
                </label>
                
                <button type="submit" style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}>
                Zaktualizuj pozycję
                </button>
            </form>
            </main>
        </div>
        </>
    );
}