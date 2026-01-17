// ===== COMPONENTE PUNTO DE VENTA OPTIMIZADO =====
import React, { useState, useEffect, useRef } from 'react'
import TicketVenta from './TicketVenta'
import { buscarProductoPorCodigo, crearVenta, formatearDinero, validarCodigoBarras } from '../../utils'
import { productService } from '../../services/productService'
import { useApi } from '../../hooks/useApi'
import { useCart } from '../../hooks/useCart'
import { useGlobalScanner } from '../../hooks/scanner'
import './Sales.css'

export const Sales = () => {
    // HOOKS PERSONALIZADOS
    const { cargando, ejecutarPeticion } = useApi()
    const mostrarError = (mensaje, esAdvertencia = false) => {
        if (mensaje.includes('sin stock') || mensaje.includes('No hay más stock')) {
            mostrarModalPersonalizado('Sin stock disponible', mensaje, 'warning')
        } else if (esAdvertencia) {
            mostrarModalPersonalizado('Advertencia', mensaje, 'warning')
        } else {
            mostrarModalPersonalizado('Producto no encontrado', mensaje, 'error')
        }
    }
    const { carrito, agregarProducto, cambiarCantidad, quitarProducto, vaciarCarrito, total } = useCart(mostrarError)

    // ESTADOS LOCALES
    const [codigoEscaneado, setCodigoEscaneado] = useState('')
    const [vendiendo, setVendiendo] = useState(false)
    const [mostrarModal, setMostrarModal] = useState(false)
    const [ventaCompletada, setVentaCompletada] = useState(null)

    // ESTADOS PARA BÚSQUEDA POR NOMBRE
    const [productos, setProductos] = useState([])
    const [sugerencias, setSugerencias] = useState([])
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)

    const [modal, setModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info' // 'info', 'error', 'success', 'warning'
    })

    // REFERENCIAS
    const campoCodigoRef = useRef(null)

    // FUNCIONES PARA EL MODAL DE ERRORES
    const mostrarModalPersonalizado = (title, message, type = 'info') => {
        setModal({
            isOpen: true,
            title,
            message,
            type
        })
    }

    const cerrarModalPersonalizado = () => {
        setModal({
            isOpen: false,
            title: '',
            message: '',
            type: 'info'
        })
    }

    // CARGAR PRODUCTOS DE SUPABASE AL INICIAR
    useEffect(() => {
        const cargarProductos = async () => {
            try {
                const data = await productService.getProducts()
                setProductos(data)
            } catch (error) {
                console.error('Error cargando productos:', error)
            }
        }
        cargarProductos()
    }, [])

    // BÚSQUEDA POR NOMBRE - Filtrar sugerencias cuando cambia el texto
    useEffect(() => {
        if (codigoEscaneado.length >= 2 && !/^\d+$/.test(codigoEscaneado)) {
            // Si tiene 2+ caracteres y NO es solo números, buscar por nombre
            const resultados = productos.filter(p =>
                p.name.toLowerCase().includes(codigoEscaneado.toLowerCase())
            ).slice(0, 5) // Máximo 5 sugerencias
            setSugerencias(resultados)
            setMostrarSugerencias(resultados.length > 0)
        } else {
            setSugerencias([])
            setMostrarSugerencias(false)
        }
    }, [codigoEscaneado, productos])

    // Seleccionar producto de las sugerencias
    const seleccionarProducto = (producto) => {
        // Mapear image_url a image para compatibilidad con el carrito
        const productoConImagen = {
            ...producto,
            image: producto.image_url
        }
        agregarProducto(productoConImagen)
        setCodigoEscaneado('')
        setSugerencias([])
        setMostrarSugerencias(false)
    }

    // HOOK SCANNER
    const manejarCodigoEscaneado = async (codigo) => {
        if (!validarCodigoBarras(codigo)) {
            mostrarModalPersonalizado(
                'Código inválido',
                'El código escaneado no tiene un formato válido.',
                'error'
            )
            return
        }

        // Buscar en productos locales primero
        const productoLocal = productos.find(p => p.barcode === codigo)
        if (productoLocal) {
            const productoConImagen = { ...productoLocal, image: productoLocal.image_url }
            agregarProducto(productoConImagen)
            return
        }

        try {
            await ejecutarPeticion(async () => {
                const producto = await buscarProductoPorCodigo(codigo)
                agregarProducto(producto)
            })
        } catch (error) {
            if (error.message && error.message.includes('404')) {
                mostrarModalPersonalizado(
                    'Producto no encontrado',
                    `No se encontró un producto con el código escaneado: ${codigo}`,
                    'error'
                )
            } else {
                mostrarModalPersonalizado(
                    'Error',
                    'Ocurrió un error al buscar el producto. Intenta nuevamente.',
                    'error'
                )
            }
        }
    }

    const { isScanning } = useGlobalScanner(manejarCodigoEscaneado, {
        minLength: 8,
        timeout: 100,
        enabled: true,
        preventOnModal: true
    })

    // FUNCIONES
    const buscarProductoManual = async (codigo) => {
        if (!validarCodigoBarras(codigo)) {
            mostrarModalPersonalizado(
                'Código inválido',
                'El código ingresado no tiene un formato válido. Por favor, verifica el código e intenta nuevamente.',
                'error'
            )
            return
        }

        try {
            await ejecutarPeticion(async () => {
                const producto = await buscarProductoPorCodigo(codigo)
                agregarProducto(producto)
                // Producto agregado exitosamente - no necesitamos notificación ya que se ve en el carrito
            })
        } catch (error) {
            // Manejar error de producto no encontrado
            if (error.message && error.message.includes('404')) {
                mostrarModalPersonalizado(
                    'Producto no encontrado',
                    `No se encontró un producto con el código ingresado: ${codigo}`,
                    'error'
                )
            } else {
                // Los errores de stock se manejan en el hook useCart
                // Otros errores generales
                mostrarModalPersonalizado(
                    'Error',
                    'Ocurrió un error al buscar el producto. Intenta nuevamente.',
                    'error'
                )
            }
        }
    }

    const finalizarVenta = async () => {
        if (carrito.length === 0) {
            mostrarModalPersonalizado(
                'Carrito vacío',
                'No puedes finalizar una venta sin productos en el carrito.',
                'warning'
            )
            return
        }

        setVendiendo(true)

        try {
            await ejecutarPeticion(async () => {
                const ventaData = {
                    items: carrito.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price
                    })),
                    total: total
                }

                const ventaCreada = await crearVenta(ventaData)

                setVentaCompletada({
                    ...ventaCreada,
                    productos: carrito
                })

                vaciarCarrito()
                setMostrarModal(true)
                // Venta completada - el modal de venta completada mostrará la confirmación
            })
        } catch {
            mostrarModalPersonalizado(
                'Error al procesar venta',
                'No se pudo completar la venta. Por favor, intenta nuevamente.',
                'error'
            )
        }

        setVendiendo(false)
    }

    const manejarCambioCodigo = (e) => {
        setCodigoEscaneado(e.target.value)
    }

    const manejarEnter = (e) => {
        if (e.key === 'Enter' && codigoEscaneado.trim()) {
            buscarProductoManual(codigoEscaneado.trim())
            setCodigoEscaneado('')
        }
    }

    const manejarFocus = () => {
        if (campoCodigoRef.current) {
            campoCodigoRef.current.focus()
        }
    }

    const cerrarModal = () => {
        setMostrarModal(false)
        setVentaCompletada(null)
    }

    // Referencia para el ticket
    const ticketRef = useRef(null);

    // Imprimir el ticket usando el nuevo componente
    const imprimirTicket = () => {
        if (!ticketRef.current) return;
        const printWindow = window.open('', '', 'width=400,height=600');
        printWindow.document.write('<html><head><title>Ticket de Venta</title>');
        printWindow.document.write('<style>body{font-family:sans-serif;padding:10px;}</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(ticketRef.current.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    return (
        <div className="sales-view">
            <header className="sales-header">
                <div className="header-badge">Terminal de Venta</div>
                <h1>Panel de Facturación</h1>
                <p>Gestiona y procesa tus ventas con precisión</p>
            </header>
            <div className="header-separator"></div>

            <div className="sales-content">
                {/* SCANNER Y BÚSQUEDA */}
                <div className="search-section" style={{ position: 'relative' }}>
                    <input
                        ref={campoCodigoRef}
                        type="text"
                        placeholder="Buscar por nombre o código de barras..."
                        value={codigoEscaneado}
                        onChange={manejarCambioCodigo}
                        onKeyDown={manejarEnter}
                        onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                        className="barcode-input"
                    />

                    {/* LISTA DE SUGERENCIAS */}
                    {mostrarSugerencias && (
                        <div className="suggestions-dropdown">
                            {sugerencias.map(producto => (
                                <div
                                    key={producto.id}
                                    className="suggestion-item"
                                    onClick={() => seleccionarProducto(producto)}
                                >
                                    <div className="suggestion-image">
                                        {producto.image_url ? (
                                            <img src={producto.image_url} alt={producto.name} />
                                        ) : (
                                            <div className="no-img">📦</div>
                                        )}
                                    </div>
                                    <div className="suggestion-info">
                                        <span className="suggestion-name">{producto.name}</span>
                                        <span className="suggestion-price">{formatearDinero(producto.price)}</span>
                                    </div>
                                    <span className="suggestion-stock">Stock: {producto.stock}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* INDICADOR DE CARGA */}
                {cargando && (
                    <div className="notification info">
                        Procesando...
                    </div>
                )}

                {/* INDICADOR DE ESCANEADO */}
                {isScanning && (
                    <div className="notification info">
                        Escaneando código...
                    </div>
                )}

                {/* CARRITO */}
                <div className="cart-section">
                    <div className="cart-header">
                        <h2>Carrito de Compras</h2>
                        {carrito.length > 0 && (
                            <button onClick={vaciarCarrito} className="btn-clear">
                                Limpiar Carrito
                            </button>
                        )}
                    </div>

                    {carrito.length === 0 ? (
                        <div className="empty-cart">
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        <div className="cart-items">
                            {carrito.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <div className="item-image">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <path d="M21 15l-5-5L5 21"></path>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="item-info">
                                        <h3>{item.name}</h3>
                                        <p className="item-price">{formatearDinero(item.price)}</p>
                                    </div>
                                    <div className="quantity-controls">
                                        <button
                                            className="qty-btn"
                                            onClick={() => cambiarCantidad(item.id, item.quantity - 1)}
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="quantity">{item.quantity}</span>
                                        <button
                                            className="qty-btn"
                                            onClick={() => cambiarCantidad(item.id, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="item-total">
                                        {formatearDinero(item.price * item.quantity)}
                                    </div>
                                    <button
                                        className="remove-btn"
                                        onClick={() => quitarProducto(item.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* TOTAL Y FINALIZAR */}
                {carrito.length > 0 && (
                    <div className="total-section">
                        <div className="total-display">
                            <span className="total-label">Total:</span>
                            <span className="total-amount">{formatearDinero(total)}</span>
                        </div>
                        <button
                            onClick={finalizarVenta}
                            disabled={vendiendo || carrito.length === 0}
                            className="btn-finalize"
                        >
                            {vendiendo ? 'Procesando...' : 'Finalizar Venta'}
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL VENTA COMPLETADA */}
            {mostrarModal && ventaCompletada && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-ticket-container">
                            <TicketVenta venta={ventaCompletada} ref={ticketRef} />
                            <div className="modal-footer modal-footer-ticket">
                                <button className="btn-imprimir-ticket" onClick={imprimirTicket}>
                                    Imprimir ticket
                                </button>
                                <button className="btn-cerrar-modal" onClick={cerrarModal}>
                                    Continuar Vendiendo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PERSONALIZADO PARA ERRORES */}
            {modal.isOpen && (
                <div className="modal-overlay" onClick={cerrarModalPersonalizado}>
                    <div className={`modal-content ${modal.type}`} onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={cerrarModalPersonalizado}>×</button>
                        <div className={`modal-title ${modal.type}`}>{modal.title}</div>
                        <div className="modal-message">{modal.message}</div>
                        <div className="modal-footer">
                            <button className="btn-modal-ok" onClick={cerrarModalPersonalizado}>
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
