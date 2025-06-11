import { useState } from 'react';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, firstName, lastName })
    });
    if (res.ok) {
      window.location.href = '/';
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <Header />
      <main className="max-w-md mx-auto p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1" />
          </div>
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="first">First Name</Label>
              <Input id="first" value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1" />
            </div>
            <div className="flex-1">
              <Label htmlFor="last">Last Name</Label>
              <Input id="last" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1" />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-spotify to-tidal text-white">Create Account</Button>
        </form>
        <p className="text-center text-sm mt-4">
          Already have an account? <a href="/login" className="text-spotify underline">Sign In</a>
        </p>
      </main>
    </div>
  );
}
