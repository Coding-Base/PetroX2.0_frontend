import React, { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { loginUser } from '../api/index';
import image from './finallogo.png';
import { useSearchParams } from 'react-router-dom';
import { useLocation } from 'react-router-dom';


export default function SignIn() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/dashboard'; // Default to dashboard if no next param
  const location = useLocation();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await loginUser(username, password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('username', username);

      navigate(next)
    } catch (err) {
      console.error(err.response || err);
      // Extract detailed message if present
      const msg = err.response?.data?.detail || 'Invalid credentials. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-center mb-6">
          <img
            src={image}
            alt="Petrox logo"
            className="h-20 w-20 object-contain rounded-full"
          />
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Sign In</h2>

        {error && (
          <div className="mb-4 text-red-700 bg-red-100 p-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your username"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none transition"
          >
            Sign In
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to={`/signup${location.search}`} className="text-blue-600 hover:underline">
            Sign Up
          </Link>
          {/* {navigate(`/signin?next=${location.pathname}${location.search}`)} */}
        </p>
      </div>
    </div>
  );
}
