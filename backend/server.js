const express = require('express');
const cors = require('cors');
const { Client, Databases, ID, Query } = require('node-appwrite');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://golden-pony-d5a490.netlify.app', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Configuración de Appwrite
const client = new Client();
client
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Endpoint para recibir webhooks de Retailbase
app.post('/webhook/venta', async (req, res) => {
    try {
        console.log('📦 Webhook recibido:', JSON.stringify(req.body, null, 2));
        
        const ventaData = req.body;
        
        // Preparar datos para Appwrite
        const ventaDocument = {
            ventaId: ventaData.ventaIdPos,
            empresaId: ventaData.empresaIdCor,
            sucursalId: ventaData.sucursalIdPos,
            fechaVenta: new Date(ventaData.fechaVentaVnt),
            totalVenta: ventaData.totalVentaVnt,
            totalCantidad: ventaData.totalCantidadVnt,
            pagoRecibido: ventaData.pagoRecibidoVnt,
            totalNeto: ventaData.totalNetoVnt,
            totalDescuento: ventaData.totalDescuentoVnt,
            clienteRut: ventaData.rutClienteVnt,
            clienteNombre: ventaData.nombreClienteVnt,
            usuario: ventaData.nombreUsuarioAppEmpPos,
            folio: ventaData.folioDoc,
            token: ventaData.tokenVnt,
            detalles: JSON.stringify(ventaData.detalles),
            ingresos: JSON.stringify(ventaData.ingresos),
            dteReceptor: JSON.stringify(ventaData.dteReceptor),
            rawData: JSON.stringify(ventaData)
        };

        // Guardar en Appwrite
        const result = await databases.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_VENTAS_ID,
            ID.unique(),
            ventaDocument
        );

        console.log('✅ Venta guardada en Appwrite:', result.$id);
        res.status(200).json({ success: true, documentId: result.$id });

    } catch (error) {
        console.error('❌ Error procesando webhook:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint para obtener ventas
app.get('/api/ventas', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        
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

    } catch (error) {
        console.error('❌ Error obteniendo ventas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint de salud
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${PORT}/webhook/venta`);
});
