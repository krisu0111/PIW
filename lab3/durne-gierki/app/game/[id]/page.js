"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function GameDetails({ params }) {
    const [game, setGame] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Dodajemy stan ładowania

    useEffect(() => {
        params.then((resolvedParams) => {
            const localDB = localStorage.getItem('durneGierkiDB');
            
            if (localDB) {
                const savedGames = JSON.parse(localDB);
                const foundGame = savedGames.find((g) => g.id.toString() === resolvedParams.id);
                setGame(foundGame);
            }
            
            setIsLoading(false); 
        });
    }, [params]);

    if (isLoading) {
        return (
            <div style={{ padding: '20px' }}>
                <h2>Ładowanie szczegółów gry...</h2>
            </div>
        );
    }

    if (!game) {
        return (
            <div style={{ padding: '20px' }}>
                <h2>Nie znaleziono takiej gry</h2>
                <Link href="/">
                    <button>Wróć do sklepu</button>
                </Link>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/">
                <button style={{ marginBottom: '20px', padding: '5px 15px' }}>Wstecz</button>
            </Link>
            
            <h1>{game.title}</h1>
            <p><b>Wydawnictwo:</b> {game.publisher}</p>
            <p><b>Cena:</b> {game.price_pln} zł</p>
            <p><b>Ilość graczy:</b> {game.min_players} - {game.max_players}</p>
            {game.avg_play_time_minutes && <p><b>Czas gry:</b> ok. {game.avg_play_time_minutes} min</p>}
            
            <h3 style={{ marginTop: '20px' }}>Opis:</h3>
            <ul style={{ paddingLeft: '20px' }}>
                {game.description && game.description.map((line, index) => (
                    <li key={index} style={{ marginBottom: '5px' }}>{line}</li>
                ))}
            </ul>
        </div>
    );
}