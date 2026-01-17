import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
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

    // Determinar el nombre a mostrar
    const displayName = activeStaff?.name || 'Usuario';
    const displayRole = activeStaff?.isOwner ? 'PROPIETARIO' : (activeRole?.toUpperCase() || 'VENDEDOR');

    return (
        <aside className="sidebar">
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
                {/* TODOS pueden ver Punto de Venta */}
                <NavLink
                    to="/"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    end
                >
                    <span className="nav-text">🛒 Punto de Venta</span>
                </NavLink>

                {/* TODOS pueden ver Inventario (solo lectura para cajeros) */}
                <NavLink
                    to="/inventario"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-text">📦 Inventario</span>
                </NavLink>

                {/* TODOS pueden ver Historial */}
                <NavLink
                    to="/historial"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-text">📜 Historial</span>
                </NavLink>

                {/* Solo GERENTES y ADMIN pueden ver Estadísticas */}
                {canAccessReports && (
                    <NavLink
                        to="/estadisticas"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-text">📊 Estadísticas</span>
                    </NavLink>
                )}

                {/* Solo ADMIN puede gestionar usuarios */}
                {isAdmin && (
                    <NavLink
                        to="/usuarios"
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <span className="nav-text">👥 Usuarios</span>
                    </NavLink>
                )}

                {/* Botón de bloquear pantalla */}
                <button onClick={lockScreen} className="nav-item lock-btn">
                    <span className="nav-text">🔒 Bloquear Pantalla</span>
                </button>

                {/* Solo mostrar cerrar sesión a admins */}
                {isAdmin && (
                    <button onClick={logout} className="nav-item logout-btn">
                        <span className="nav-text">🚪 Cerrar Sesión</span>
                    </button>
                )}
            </nav>
        </aside>
    )
}
