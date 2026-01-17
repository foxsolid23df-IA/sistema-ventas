import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Login.css';

export const Login = () => {
    const { login, signUp, user } = useAuth();

    // UI State
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        storeName: '',
        fullName: ''
    });

    if (user) {
        return <Navigate to="/" />;
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isRegistering) {
                await signUp(formData.email, formData.password, formData.storeName, formData.fullName);
                // Signup usually logs in automatically in Supabase, or requires email confirmation.
                // If auto-login, the 'user' effect will redirect. 
                // If confirmation needed, we might need a message. 
                // Default Supabase config often confirms email by default for dev? 
                // We'll assume auto-login or handle "Check your email" if needed.
            } else {
                await login(formData.email, formData.password);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-icon">🔐</div>
                    <h1>{isRegistering ? 'Crear Cuenta' : 'Bienvenido'}</h1>
                    <p>{isRegistering ? 'Registra tu negocio en Business Pro' : 'Gestiona tu negocio profesionalmente'}</p>
                </div>

                {error && <div className="login-error-msg">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    {isRegistering && (
                        <>
                            <div className="form-group">
                                <label>Nombre del Negocio</label>
                                <input
                                    type="text"
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    placeholder="Ej: Minimarket Central"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Tu Nombre Completo</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="nombre@ejemplo.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                        <button
                            type="button"
                            className="toggle-auth-btn"
                            onClick={() => setIsRegistering(!isRegistering)}
                        >
                            {isRegistering ? 'Inicia Sesión' : 'Regístrate'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
