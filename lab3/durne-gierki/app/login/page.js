"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        alert("Konto utworzone pomyślnie, jesteś zalogowany");
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      }
      router.push('/');
    } catch (err) {
      console.error("Błąd autoryzacji:", err);
      if (err.code === 'auth/email-already-in-use') setError('Ten e-mail jest już zajęty.');
      else if (err.code === 'auth/invalid-credential') setError('Błędny e-mail lub hasło.');
      else if (err.code === 'auth/weak-password') setError('Hasło musi mieć minimum 6 znaków.');
      else setError('Błąd autoryzacji');
    }
  };

  return (
    <>
      <header className="top">
        <h1>Durne Gierki - {isRegistering ? 'Rejestracja' : 'Logowanie'}</h1>
        <nav>
          <Link href="/"><button>Wstecz</button></Link>
        </nav>
      </header>

      <div className="main-container">
        <main style={{ padding: '20px', margin: '0 auto', width: '100%', maxWidth: '400px' }}>
          <h2>{isRegistering ? 'Załóż nowe konto' : 'Zaloguj się'}</h2>
          
          {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <label>
              Adres e-mail:
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                required 
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </label>
            <label>
              Hasło:
              <input 
                type="password" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                required 
                style={{ width: '100%', padding: '8px', marginTop: '5px' }}
              />
            </label>
            
            <button type="submit" style={{ padding: '10px', marginTop: '10px', cursor: 'pointer' }}>
              {isRegistering ? 'Zarejestruj się' : 'Zaloguj'}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              onClick={() => setIsRegistering(!isRegistering)} 
              style={{ background: 'none', border: 'none', color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}
            >
              {isRegistering ? 'Masz już konto? Zaloguj się' : 'Nie masz konta? Zarejestruj się'}
            </button>
          </div>
        </main>
      </div>
    </>
  );
}