"use client";
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function EditGame({ params }) {
    const resolvedParams = use(params); 
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        title: '', description: '', price: '', publisher: ''
    });

    useEffect(() => {
        const savedGames = JSON.parse(localStorage.getItem('durneGierkiDB') || '[]');
        const gameToEdit = savedGames.find(g => g.id.toString() === resolvedParams.id);
        
        if (gameToEdit) {
        setFormData({
            title: gameToEdit.title,
            description: gameToEdit.description ? gameToEdit.description.join('\n') : '',
            price: gameToEdit.price_pln,
            publisher: gameToEdit.publisher
        });
        }
    }, [resolvedParams.id]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const savedGames = JSON.parse(localStorage.getItem('durneGierkiDB') || '[]');
        const index = savedGames.findIndex(g => g.id.toString() === resolvedParams.id);
        
        if (index !== -1) {
        savedGames[index] = {
            ...savedGames[index],
            title: formData.title,
            description: formData.description.split('\n'),
            price_pln: parseFloat(formData.price),
            publisher: formData.publisher
        };
        
        localStorage.setItem('durneGierkiDB', JSON.stringify(savedGames));
        alert("Gra została pomyślnie zaktualizowana!");
        router.push('/');
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
