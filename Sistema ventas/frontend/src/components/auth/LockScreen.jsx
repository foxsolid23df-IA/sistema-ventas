import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Swal from 'sweetalert2';
import './LockScreen.css';

export const LockScreen = () => {
    const [pin, setPin] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const { loginWithPin, unlockAsOwner, storeName, logout } = useAuth();

    const handlePinInput = (digit) => {
        if (pin.length < 6 && !isValidating) {
            setPin(prev => prev + digit);
        }
    };

    const handleBackspace = () => {
        if (!isValidating) {
            setPin(prev => prev.slice(0, -1));
        }
    };

    const handleClear = () => {
        if (!isValidating) {
            setPin('');
        }
    };

    const handleSubmit = async () => {
        if (pin.length < 4 || isValidating) {
            return;
        }

        setIsValidating(true);

        try {
            const staff = await loginWithPin(pin);
            Swal.fire({
                title: `¡Bienvenido!`,
                text: `${staff.name} - ${staff.role.toUpperCase()}`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('PIN Incorrecto', 'Verifica tu PIN e intenta de nuevo', 'error');
            setPin('');
        } finally {
            setIsValidating(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleOwnerAccess = async () => {
        unlockAsOwner();
        Swal.fire({
            title: '¡Bienvenido, Propietario!',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión de la tienda?',
            text: 'Esto desvinculará este dispositivo. Necesitarás email y contraseña para volver a iniciar sesión.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            logout();
        }
    };

    return (
        <div className="lock-screen" onKeyDown={handleKeyDown} tabIndex={0}>
            <div className="lock-container">
                <div className="lock-header">
                    <div className="store-name">{storeName || 'Mi Tienda'}</div>
                    <div className="lock-icon">🔐</div>
                    <h1>Pantalla Bloqueada</h1>
                    <p>Ingresa tu PIN para comenzar</p>
                </div>

                <div className="pin-display">
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={i}
                            className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
                        />
                    ))}
                </div>

                <div className="pin-keypad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                        <button
                            key={digit}
                            className="key-btn"
                            onClick={() => handlePinInput(digit.toString())}
                            disabled={isValidating}
                        >
                            {digit}
                        </button>
                    ))}
                    <button className="key-btn clear" onClick={handleClear} disabled={isValidating}>C</button>
                    <button className="key-btn" onClick={() => handlePinInput('0')} disabled={isValidating}>0</button>
                    <button className="key-btn backspace" onClick={handleBackspace} disabled={isValidating}>⌫</button>
                </div>

                <button
                    className="unlock-btn"
                    onClick={handleSubmit}
                    disabled={pin.length < 4 || isValidating}
                >
                    {isValidating ? 'Verificando...' : 'Desbloquear'}
                </button>

                <div className="lock-actions">
                    <button className="owner-btn" onClick={handleOwnerAccess}>
                        👑 Soy el Propietario
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 Cerrar Sesión de la Tienda
                    </button>
                </div>

                <div className="lock-hint">
                    <small>💡 Ingresa tu PIN de 4-6 dígitos y presiona "Desbloquear"</small>
                </div>
            </div>
        </div>
    );
};
