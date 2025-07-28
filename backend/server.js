const express = require('express');
const cors = require('cors');
const { Client, Databases, ID, Query } = require('node-appwrite');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Validar variables de entorno críticas
const requiredEnvVars = [
    'APPWRITE_PROJECT_ID',
    'APPWRITE_API_KEY',
    'APPWRITE_DATABASE_ID',
    'APPWRITE_COLLECTION_VENTAS_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.warn('⚠️ Variables de entorno faltantes:', missingVars);
    console.warn('El servidor iniciará en modo de prueba sin Appwrite');
    console.warn('Para funcionalidad completa, configura las siguientes variables:');
    missingVars.forEach(varName => {
        console.warn(`  - ${varName}`);
    });
}

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Configuración de Appwrite
let client, databases;
let isAppwriteConfigured = false;

if (process.env.APPWRITE_PROJECT_ID && process.env.APPWRITE_API_KEY) {
    client = new Client();
    client
        .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);
    
    databases = new Databases(client);
    isAppwriteConfigured = true;
    console.log('✅ Appwrite configurado correctamente');
} else {
    console.log('⚠️ Appwrite no configurado - Modo de prueba activado');
}

// Endpoint para recibir webhooks de Retailbase
app.post('/webhook/venta', async (req, res) => {
    try {
        console.log('📦 Webhook recibido:', JSON.stringify(req.body, null, 2));
        
        const ventaData = req.body;
        
        // Log de campos disponibles para debugging
        console.log('🔍 Campos disponibles en ventaData:');
        console.log('fechaVentaVnt:', ventaData.fechaVentaVnt);
        console.log('folioDoc:', ventaData.folioDoc);
        console.log('folio:', ventaData.folio);
        console.log('nombreClienteVnt:', ventaData.nombreClienteVnt);
        console.log('totalVentaVnt:', ventaData.totalVentaVnt);
        console.log('Todos los campos:', Object.keys(ventaData));
        
        // Preparar datos para Appwrite con validación
        const ventaDocument = {
            ventaId: ventaData.ventaIdPos || ventaData.ventaId || 0,
            empresaId: ventaData.empresaIdCor || ventaData.empresaId || 0,
            sucursalId: ventaData.sucursalIdPos || ventaData.sucursalId || 0,
            fechaVenta: ventaData.fechaVentaVnt ? new Date(ventaData.fechaVentaVnt) : new Date(),
            totalVenta: ventaData.totalVentaVnt || ventaData.totalVenta || 0,
            totalCantidad: ventaData.totalCantidadVnt || ventaData.totalCantidad || 0,
            pagoRecibido: ventaData.pagoRecibidoVnt || ventaData.pagoRecibido || 0,
            totalNeto: ventaData.totalNetoVnt || ventaData.totalNeto || 0,
            totalDescuento: ventaData.totalDescuentoVnt || ventaData.totalDescuento || 0,
            clienteRut: ventaData.rutClienteVnt || ventaData.clienteRut || 'N/A',
            clienteNombre: ventaData.nombreClienteVnt || ventaData.clienteNombre || 'Cliente',
            usuario: ventaData.nombreUsuarioAppEmpPos || ventaData.usuario || 'Usuario',
            folio: ventaData.folioDoc || ventaData.folio || ventaData.numeroFolio || ventaData.numeroDocumento || 0,
            token: ventaData.tokenVnt || ventaData.token || 'N/A',
            detalles: JSON.stringify(ventaData.detalles || []),
            ingresos: JSON.stringify(ventaData.ingresos || []),
            dteReceptor: JSON.stringify(ventaData.dteReceptor || {}),
            rawData: JSON.stringify(ventaData)
        };

        if (isAppwriteConfigured) {
            // Guardar en Appwrite
            const result = await databases.createDocument(
                process.env.APPWRITE_DATABASE_ID,
                process.env.APPWRITE_COLLECTION_VENTAS_ID,
                ID.unique(),
                ventaDocument
            );
            console.log('✅ Venta guardada en Appwrite:', result.$id);
            res.status(200).json({ success: true, documentId: result.$id });
        } else {
            // Modo de prueba - solo log
            console.log('✅ Venta procesada (modo prueba):', ventaDocument);
            res.status(200).json({ success: true, message: 'Venta procesada en modo prueba' });
        }

    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para obtener ventas
app.get('/api/ventas', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        
        if (isAppwriteConfigured) {
            const result = await databases.listDocuments(
                process.env.APPWRITE_DATABASE_ID,
                process.env.APPWRITE_COLLECTION_VENTAS_ID,
                [
                    // Ordenar por fecha más reciente
                    Query.orderDesc('fechaVenta'),
                    Query.limit(parseInt(limit)),
                    Query.offset(parseInt(offset))
                ]
            );

            res.json({
                success: true,
                ventas: result.documents,
                total: result.total
            });
        } else {
            // Modo de prueba - datos de ejemplo
            const mockVentas = [
                {
                    $id: 'test-1',
                    ventaId: 1001,
                    fechaVenta: new Date().toISOString(),
                    folio: 1001,
                    clienteNombre: 'Cliente de Prueba',
                    clienteRut: '12345678-9',
                    totalVenta: 25000,
                    totalCantidad: 3,
                    usuario: 'Usuario Sistema',
                    detalles: JSON.stringify([
                        {
                            skuDtv: 'SKU001',
                            nombreProductoDtv: 'Producto de Prueba',
                            cantidadProductoDtv: 2,
                            precioProductoDtv: 10000,
                            totalProductoDtv: 20000
                        }
                    ]),
                    ingresos: JSON.stringify([
                        {
                            glosaInv: 'Efectivo',
                            montoInv: 25000
                        }
                    ])
                }
            ];

            res.json({
                success: true,
                ventas: mockVentas,
                total: mockVentas.length
            });
        }

    } catch (error) {
        console.error('❌ Error obteniendo ventas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para eliminar una venta
app.delete('/api/ventas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`🗑️ Intentando eliminar venta: ${id}`);
        
        // Eliminar documento de Appwrite
        await databases.deleteDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_VENTAS_ID,
            id
        );

        console.log(`✅ Venta eliminada exitosamente: ${id}`);
        res.json({ success: true, message: 'Venta eliminada exitosamente' });

    } catch (error) {
        console.error('❌ Error eliminando venta:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint de salud
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: {
            port: PORT,
            appwriteProject: process.env.APPWRITE_PROJECT_ID ? 'Configured' : 'Missing',
            database: process.env.APPWRITE_DATABASE_ID ? 'Configured' : 'Missing',
            collection: process.env.APPWRITE_COLLECTION_VENTAS_ID ? 'Configured' : 'Missing'
        }
    });
});

// Endpoint de prueba
app.get('/', (req, res) => {
    res.json({ 
        message: '🚀 Backend de Dashboard de Ventas funcionando',
        endpoints: {
            health: '/health',
            webhook: '/webhook/venta',
            ventas: '/api/ventas',
            deleteVenta: '/api/ventas/:id'
        }
    });
});

// Endpoint para crear datos de prueba
app.post('/api/test-data', async (req, res) => {
    try {
        const testVenta = {
            ventaId: 12345,
            empresaId: 1,
            sucursalId: 1,
            fechaVenta: new Date(),
            totalVenta: 25000,
            totalCantidad: 3,
            pagoRecibido: 25000,
            totalNeto: 21008,
            totalDescuento: 0,
            clienteRut: '12345678-9',
            clienteNombre: 'Cliente de Prueba',
            usuario: 'Usuario Sistema',
            folio: 1001,
            token: 'test-token-123',
            detalles: JSON.stringify([
                {
                    skuDtv: 'SKU001',
                    nombreProductoDtv: 'Producto 1',
                    cantidadProductoDtv: 2,
                    precioProductoDtv: 10000,
                    totalProductoDtv: 20000
                }
            ]),
            ingresos: JSON.stringify([
                {
                    glosaInv: 'Efectivo',
                    montoInv: 25000
                }
            ]),
            dteReceptor: JSON.stringify({}),
            rawData: JSON.stringify({})
        };

        const result = await databases.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_VENTAS_ID,
            ID.unique(),
            testVenta
        );

        res.json({ success: true, documentId: result.$id, message: 'Datos de prueba creados' });

    } catch (error) {
        console.error('❌ Error creando datos de prueba:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook/venta`);
});
