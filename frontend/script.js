// Configuración
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://admindonbalato.up.railway.app/api';

// Estado global
let ventasData = [];
let filteredData = [];

// Elementos del DOM
const refreshBtn = document.getElementById('refreshBtn');
const dateFrom = document.getElementById('dateFrom');
const dateTo = document.getElementById('dateTo');
const searchInput = document.getElementById('searchInput');
const limitSelect = document.getElementById('limitSelect');
const salesTableBody = document.getElementById('salesTableBody');
const ventaModal = document.getElementById('ventaModal');
const ventaModalBody = document.getElementById('ventaModalBody');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeDates();
    loadVentas();
    setupEventListeners();
});

function initializeDates() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 7);
    
    dateFrom.value = yesterday.toISOString().split('T')[0];
    dateTo.value = today.toISOString().split('T')[0];
}

function setupEventListeners() {
    refreshBtn.addEventListener('click', loadVentas);
    searchInput.addEventListener('input', filterVentas);
    limitSelect.addEventListener('change', loadVentas);
    dateFrom.addEventListener('change', loadVentas);
    dateTo.addEventListener('change', loadVentas);
    
    // Modal de detalles
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === ventaModal) closeModal();
    });
    
    // Modal de confirmación
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('confirmModal')) closeConfirmModal();
    });
}

async function loadVentas() {
    try {
        showLoading();
        
        const limit = limitSelect.value;
        const response = await fetch(`${API_BASE_URL}/ventas?limit=${limit}`);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            ventasData = data.ventas;
            filteredData = [...ventasData];
            updateStats();
            renderVentas();
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error cargando ventas:', error);
        showError('Error al cargar las ventas. Verifica que el servidor esté funcionando.');
    }
}

function showLoading() {
    salesTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Cargando ventas...
            </td>
        </tr>
    `;
}

function showError(message) {
    salesTableBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading" style="color: #e53e3e;">
                <i class="fas fa-exclamation-triangle"></i> ${message}
            </td>
        </tr>
    `;
}

function updateStats() {
    const today = new Date().toDateString();
    const ventasHoy = filteredData.filter(venta => 
        new Date(venta.fechaVenta).toDateString() === today
    );
    
    const totalVentas = ventasHoy.reduce((sum, venta) => sum + venta.totalVenta, 0);
    const cantidadVentas = ventasHoy.length;
    const promedioVenta = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;
    
    const ultimaVenta = filteredData.length > 0 ? 
        new Date(filteredData[0].fechaVenta).toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit'
        }) : '--:--';
    
    document.getElementById('totalVentas').textContent = formatCurrency(totalVentas);
    document.getElementById('cantidadVentas').textContent = cantidadVentas;
    document.getElementById('promedioVenta').textContent = formatCurrency(promedioVenta);
    document.getElementById('ultimaVenta').textContent = ultimaVenta;
}

function renderVentas() {
    if (filteredData.length === 0) {
        salesTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="loading">
                    <i class="fas fa-inbox"></i> No hay ventas para mostrar
                </td>
            </tr>
        `;
        return;
    }
    
    salesTableBody.innerHTML = filteredData.map(venta => `
        <tr>
            <td>${formatDate(venta.fechaVenta)}</td>
            <td><strong>#${venta.folio}</strong></td>
            <td>
                <div>
                    <strong>${venta.clienteNombre}</strong><br>
                    <small style="color: #666;">${venta.clienteRut}</small>
                </div>
            </td>
            <td><strong>${formatCurrency(venta.totalVenta)}</strong></td>
            <td>${venta.totalCantidad} items</td>
            <td>${venta.usuario}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-info btn-small" onclick="showVentaDetail('${venta.$id}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteVenta('${venta.$id}', '${venta.folio}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterVentas() {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredData = ventasData.filter(venta => {
        return (
            venta.clienteNombre.toLowerCase().includes(searchTerm) ||
            venta.clienteRut.toLowerCase().includes(searchTerm) ||
            venta.folio.toString().includes(searchTerm) ||
            (venta.usuario && venta.usuario.toLowerCase().includes(searchTerm))
        );
    });
    
    updateStats();
    renderVentas();
}

function showVentaDetail(ventaId) {
    const venta = ventasData.find(v => v.$id === ventaId);
    if (!venta) return;
    
    const detalles = JSON.parse(venta.detalles);
    const ingresos = JSON.parse(venta.ingresos);
    
    ventaModalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
            <div>
                <h4 style="color: #4a5568; margin-bottom: 15px;">
                    <i class="fas fa-info-circle"></i> Información General
                </h4>
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px;">
                    <p><strong>Folio:</strong> #${venta.folio}</p>
                    <p><strong>Fecha:</strong> ${formatDateTime(venta.fechaVenta)}</p>
                    <p><strong>Cliente:</strong> ${venta.clienteNombre} (${venta.clienteRut})</p>
                    <p><strong>Usuario:</strong> ${venta.usuario}</p>
                    <p><strong>Token:</strong> ${venta.token}</p>
                </div>
            </div>
            <div>
                <h4 style="color: #4a5568; margin-bottom: 15px;">
                    <i class="fas fa-calculator"></i> Totales
                </h4>
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px;">
                    <p><strong>Total Venta:</strong> ${formatCurrency(venta.totalVenta)}</p>
                    <p><strong>Total Neto:</strong> ${formatCurrency(venta.totalNeto)}</p>
                    <p><strong>Descuentos:</strong> ${formatCurrency(venta.totalDescuento)}</p>
                    <p><strong>Pago Recibido:</strong> ${formatCurrency(venta.pagoRecibido)}</p>
                    <p><strong>Cantidad Items:</strong> ${venta.totalCantidad}</p>
                </div>
            </div>
        </div>
        
        <h4 style="color: #4a5568; margin-bottom: 15px;">
            <i class="fas fa-shopping-cart"></i> Productos
        </h4>
        <div style="overflow-x: auto; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <thead>
                    <tr style="background: #667eea; color: white;">
                        <th style="padding: 12px; text-align: left;">SKU</th>
                        <th style="padding: 12px; text-align: left;">Producto</th>
                        <th style="padding: 12px; text-align: right;">Cantidad</th>
                        <th style="padding: 12px; text-align: right;">Precio Unit.</th>
                        <th style="padding: 12px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${detalles.map(detalle => `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px;">${detalle.skuDtv}</td>
                            <td style="padding: 12px;">${detalle.nombreProductoDtv}</td>
                            <td style="padding: 12px; text-align: right;">${detalle.cantidadProductoDtv}</td>
                            <td style="padding: 12px; text-align: right;">${formatCurrency(detalle.precioProductoDtv)}</td>
                            <td style="padding: 12px; text-align: right;"><strong>${formatCurrency(detalle.totalProductoDtv)}</strong></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <h4 style="color: #4a5568; margin-bottom: 15px;">
            <i class="fas fa-credit-card"></i> Formas de Pago
        </h4>
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px;">
            ${ingresos.map(ingreso => `
                <p><strong>${ingreso.glosaInv}:</strong> ${formatCurrency(ingreso.montoInv)}</p>
            `).join('')}
        </div>
    `;
    
    ventaModal.style.display = 'block';
}

function closeModal() {
    ventaModal.style.display = 'none';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Variables globales para el modal de confirmación
let ventaToDelete = null;
let deleteBtnElement = null;

// Función para eliminar una venta
function deleteVenta(ventaId, folio) {
    // Guardar información para el modal
    ventaToDelete = { id: ventaId, folio: folio };
    deleteBtnElement = event.target.closest('.btn-danger');
    
    // Mostrar modal de confirmación
    document.getElementById('confirmFolio').textContent = `#${folio}`;
    document.getElementById('confirmModal').style.display = 'block';
}

// Función para confirmar eliminación
async function confirmDelete() {
    if (!ventaToDelete) return;
    
    try {
        // Mostrar loading en el botón del modal
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        confirmBtn.disabled = true;
        
        // Realizar petición DELETE
        const response = await fetch(`${API_BASE_URL}/ventas/${ventaToDelete.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Cerrar modal
            closeConfirmModal();
            
            // Mostrar mensaje de éxito
            showNotification('✅ Venta eliminada exitosamente', 'success');
            
            // Recargar datos
            await loadVentas();
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error eliminando venta:', error);
        showNotification('❌ Error al eliminar la venta', 'error');
        
        // Restaurar botón
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}

// Función para cerrar modal de confirmación
function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    ventaToDelete = null;
    deleteBtnElement = null;
}

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Agregar al DOM
    document.body.appendChild(notification);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}
