import React, { useState, useEffect, useRef } from 'react';
import './Inventory.css';
import { productService } from '../../services/productService';
import CameraScanner from '../common/CameraScanner';
import { validarCodigoBarras } from '../../utils';
import Swal from 'sweetalert2';

// Icons
import {
    FiPlus,
    FiSearch,
    FiEdit2,
    FiTrash2,
    FiX,
    FiSave,
    FiUploadCloud,
    FiImage
} from 'react-icons/fi';

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        barcode: '',
        price: '',
        stock: '',
        image: ''
    });

    // Image Upload State
    const [previewImage, setPreviewImage] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Camera Scanner State
    const [mostrarCameraScanner, setMostrarCameraScanner] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await productService.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            name: '',
            barcode: '',
            price: '',
            stock: '',
            image: ''
        });
        setPreviewImage(null);
        setEditingProduct(null);
    };

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                barcode: product.barcode || '',
                price: product.price,
                stock: product.stock,
                image: product.image_url || ''
            });
            setPreviewImage(product.image_url || null);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    const processImage = (file) => {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Swal.fire('Error', 'El archivo debe ser una imagen', 'error');
            return;
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            Swal.fire('Error', 'La imagen no debe superar los 2MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result;
            // Basic optimization: if string is too long, we might warn, but for now we trust the limit
            setPreviewImage(base64String);
            setFormData(prev => ({ ...prev, image: base64String }));
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processImage(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            processImage(e.target.files[0]);
        }
    };

    const removeImage = (e) => {
        e.stopPropagation();
        setPreviewImage(null);
        setFormData(prev => ({ ...prev, image: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.price || !formData.stock) {
            Swal.fire('Error', 'Por favor completa los campos obligatorios', 'warning');
            return;
        }

        try {
            const productData = {
                name: formData.name,
                barcode: formData.barcode,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                image: formData.image
            };

            if (editingProduct) {
                await productService.updateProduct(editingProduct.id, productData);
                Swal.fire('Actualizado', 'Producto actualizado correctamente', 'success');
            } else {
                await productService.createProduct(productData);
                Swal.fire('Creado', 'Producto creado correctamente', 'success');
            }

            handleCloseModal();
            fetchProducts();
        } catch (error) {
            console.error('Error saving product:', error);
            Swal.fire('Error', 'Error al guardar el producto', 'error');
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                await productService.deleteProduct(id);
                Swal.fire('Eliminado', 'Producto eliminado', 'success');
                fetchProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                Swal.fire('Error', 'No se pudo eliminar el producto', 'error');
            }
        }
    };

    // Manejar escaneo de cámara
    const manejarEscaneoCamara = (codigo) => {
        const codigoLimpio = codigo.trim();

        if (!codigoLimpio) return;

        // Validar formato de código de barras
        if (!validarCodigoBarras(codigoLimpio)) {
            Swal.fire({
                icon: 'error',
                title: 'Código inválido',
                text: 'El código escaneado no tiene un formato válido.',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        // Actualizar el campo de código de barras en el formulario
        setFormData(prev => ({
            ...prev,
            barcode: codigoLimpio
        }));

        // Mostrar confirmación
        Swal.fire({
            icon: 'success',
            title: 'Código escaneado',
            text: `Código de barras: ${codigoLimpio}`,
            timer: 1500,
            showConfirmButton: false
        });
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode && product.barcode.includes(searchTerm))
    );

    return (
        <div className="inventory-container">
            <div className="inventory-header">
                <div className="header-content">
                    <h1>Inventario</h1>
                    <p>Gestiona tus productos y existencias</p>
                </div>
                <button className="add-btn" onClick={() => handleOpenModal()}>
                    <FiPlus /> Nuevo Producto
                </button>
            </div>

            <div className="inventory-controls">
                <div className="search-bar">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-state">Cargando inventario...</div>
            ) : (
                <div className="products-grid">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div key={product.id} className="product-card">
                                <div className="product-image-container">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="product-image"
                                        />
                                    ) : (
                                        <div className="no-image-placeholder">
                                            <FiImage size={32} />
                                        </div>
                                    )}
                                    <span className={`stock-badge ${product.stock < 10 ? 'low-stock' : ''}`}>
                                        Stock: {product.stock}
                                    </span>
                                </div>

                                <div className="product-details">
                                    <h3>{product.name}</h3>
                                    <div className="product-meta">
                                        <span className="price">${product.price.toFixed(2)}</span>
                                        <span className="barcode">{product.barcode || 'Sin código'}</span>
                                    </div>

                                    <div className="actions">
                                        <button
                                            className="icon-btn edit"
                                            onClick={() => handleOpenModal(product)}
                                            title="Editar"
                                        >
                                            <FiEdit2 />
                                        </button>
                                        <button
                                            className="icon-btn delete"
                                            onClick={() => handleDelete(product.id)}
                                            title="Eliminar"
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <p>No hay productos registrados.</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button className="close-btn" onClick={handleCloseModal}>
                                <FiX />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="product-form">
                            {/* Image Upload Area - Keeping Drag & Drop */}
                            <div
                                className={`image-upload-area ${dragActive ? 'drag-active' : ''}`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />

                                {previewImage ? (
                                    <div className="image-preview-wrapper">
                                        <img src={previewImage} alt="Preview" className="image-preview" />
                                        <button
                                            type="button"
                                            className="remove-image-btn"
                                            onClick={removeImage}
                                        >
                                            <FiX />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="upload-placeholder">
                                        <FiUploadCloud size={48} />
                                        <p>Arrastra una imagen o haz clic para subir</p>
                                        <span>JPG, PNG (Max 2MB)</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Nombre del Producto *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Ej. Coca Cola 600ml"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Código de Barras</label>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            name="barcode"
                                            value={formData.barcode}
                                            onChange={handleInputChange}
                                            placeholder="Escanear código..."
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setMostrarCameraScanner(true)}
                                            title="Escanear código con cámara"
                                            style={{
                                                padding: '10px 16px',
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.3s ease',
                                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-1px)'
                                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)'
                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                                            }}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                                <circle cx="12" cy="13" r="4"></circle>
                                            </svg>
                                            Cámara
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Precio *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        step="0.50"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Stock Inicial *</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="save-btn">
                                    <FiSave /> Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Scanner de Cámara */}
            <CameraScanner
                isOpen={mostrarCameraScanner}
                onClose={() => setMostrarCameraScanner(false)}
                onScan={manejarEscaneoCamara}
            />
        </div>
    );
};

export { Inventory };
