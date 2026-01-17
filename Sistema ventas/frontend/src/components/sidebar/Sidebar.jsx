import { useState } from 'react';
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { CashCut } from '../cashcut/CashCut'
import './Sidebar.css'

export const Sidebar = () => {
    const {
        logout,
        isAdmin,
        canAccessReports,
        activeStaff,
        lockScreen,
        storeName,
        activeRole
    } = useAuth();

    const [showCashCut, setShowCashCut] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Determinar el nombre a mostrar
    const displayName = activeStaff?.name || 'Usuario';
    const displayRole = activeStaff?.isOwner ? 'PROPIETARIO' : (activeRole?.toUpperCase() || 'VENDEDOR');

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Header móvil con toggle */}
            <header className="mobile-header">
                <button className="hamburger" onClick={toggleSidebar}>
                    {isOpen ? '✕' : '☰'}
                </button>
                <div className="mobile-logo">{storeName || 'MI TIENDA'}</div>
                <div className="mobile-user-icon" onClick={lockScreen}>👤</div>
            </header>

            {/* Overlay para cerrar sidebar al tocar fuera */}
            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

            <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
                <div className="sidebar-header">
                    <h2>Menu</h2>
                    <small>{storeName || 'Mi Tienda'}</small>
                </div>

                {/* Mostrar quién está operando */}
                <div className="active-user-badge">
                    <span className="user-icon">👤</span>
                    <div className="user-info">
                        <span className="user-name">{displayName}</span>
                        <span className="user-role">{displayRole}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink
                        to="/"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setIsOpen(false)}
                        end
                    >
                        <span className="nav-text">🛒 Punto de Venta</span>
                    </NavLink>

                    <NavLink
                        to="/inventario"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="nav-text">📦 Inventario</span>
                    </NavLink>

                    <NavLink
                        to="/historial"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="nav-text">📜 Historial</span>
                    </NavLink>

                    {canAccessReports && (
                        <NavLink
                            to="/estadisticas"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="nav-text">📊 Estadísticas</span>
                        </NavLink>
                    )}

                    {isAdmin && (
                        <NavLink
                            to="/usuarios"
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="nav-text">👥 Usuarios</span>
                        </NavLink>
                    )}

                    <button onClick={() => { setShowCashCut(true); setIsOpen(false); }} className="nav-item cash-cut-btn">
                        <span className="nav-text">💰 Corte de Caja</span>
                    </button>

                    <button onClick={() => { lockScreen(); setIsOpen(false); }} className="nav-item lock-btn">
                        <span className="nav-text">🔒 Bloquear Pantalla</span>
                    </button>

                    {isAdmin && (
                        <button onClick={() => { logout(); setIsOpen(false); }} className="nav-item logout-btn">
                            <span className="nav-text">🚪 Cerrar Sesión</span>
                        </button>
                    )}
                </nav>
            </aside>

            {/* Modal de Corte de Caja */}
            {showCashCut && (
                <CashCut onClose={() => setShowCashCut(false)} />
            )}
        </>
    )
}
