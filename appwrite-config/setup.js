const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

// Configuración de Appwrite
const client = new Client();
client
    .setEndpoint('https://nyc.cloud.appwrite.io/v1') // Tu endpoint de Appwrite
    .setProject('asistoraview') // Tu Project ID
    .setKey('standard_9c3c3ec60a0e5a9adf56b6c177e73c9b0dd3a57fef995abfa903ba91834d1137319d3cec20c3fbd441a8cbab993a49a56a79026ecc71f1e5b5976f51119ec0cddfcff4fa658bc2473e288c550adf3864649750bc8a0ca9426fbabad6aadb6fe5efafacc5df5f29d610e26daee0c7aa6b192c5074dfeb57d166f67416117cd7db'); // Tu API Key

const databases = new Databases(client);

async function setupAppwrite() {
    try {
        console.log('🚀 Configurando Appwrite...');
        
        // 1. Crear base de datos
        console.log('📊 Creando base de datos...');
        const database = await databases.create(
            ID.unique(),
            'SalesDatabase',
            true // enabled
        );
        console.log('✅ Base de datos creada:', database.$id);
        
        // 2. Crear colección de ventas
        console.log('📋 Creando colección de ventas...');
        const ventasCollection = await databases.createCollection(
            database.$id,
            ID.unique(),
            'ventas',
            [
                Permission.read(Role.any()),
                Permission.create(Role.any()),
                Permission.update(Role.any()),
                Permission.delete(Role.any())
            ],
            true, // documentSecurity
            true  // enabled
        );
        console.log('✅ Colección de ventas creada:', ventasCollection.$id);
        
        // 3. Crear atributos para la colección
        console.log('🔧 Creando atributos...');
        
        const attributes = [
            { key: 'ventaId', type: 'integer', required: true },
            { key: 'empresaId', type: 'integer', required: true },
            { key: 'sucursalId', type: 'integer', required: true },
            { key: 'fechaVenta', type: 'datetime', required: true },
            { key: 'totalVenta', type: 'double', required: true },
            { key: 'totalCantidad', type: 'integer', required: true },
            { key: 'pagoRecibido', type: 'double', required: true },
            { key: 'totalNeto', type: 'double', required: true },
            { key: 'totalDescuento', type: 'double', required: true },
            { key: 'clienteRut', type: 'string', size: 20, required: true },
            { key: 'clienteNombre', type: 'string', size: 255, required: true },
            { key: 'cajero', type: 'string', size: 255, required: false },
            { key: 'usuario', type: 'string', size: 255, required: false },
            { key: 'folio', type: 'integer', required: true },
            { key: 'token', type: 'string', size: 255, required: true },
            { key: 'detalles', type: 'string', size: 65535, required: true }, // JSON
            { key: 'ingresos', type: 'string', size: 65535, required: true }, // JSON
            { key: 'dteReceptor', type: 'string', size: 65535, required: false }, // JSON
            { key: 'rawData', type: 'string', size: 65535, required: true } // JSON completo
        ];
        
        for (const attr of attributes) {
            try {
                if (attr.type === 'string') {
                    await databases.createStringAttribute(
                        database.$id,
                        ventasCollection.$id,
                        attr.key,
                        attr.size,
                        attr.required
                    );
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(
                        database.$id,
                        ventasCollection.$id,
                        attr.key,
                        attr.required
                    );
                } else if (attr.type === 'double') {
                    await databases.createFloatAttribute(
                        database.$id,
                        ventasCollection.$id,
                        attr.key,
                        attr.required
                    );
                } else if (attr.type === 'datetime') {
                    await databases.createDatetimeAttribute(
                        database.$id,
                        ventasCollection.$id,
                        attr.key,
                        attr.required
                    );
                }
                console.log(`✅ Atributo creado: ${attr.key}`);
                
                // Esperar un poco entre creaciones para evitar rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error creando atributo ${attr.key}:`, error.message);
            }
        }
        
        // 4. Crear índices
        console.log('🔍 Creando índices...');
        try {
            await databases.createIndex(
                database.$id,
                ventasCollection.$id,
                'fechaVenta_index',
                'key',
                ['fechaVenta'],
                ['desc']
            );
            console.log('✅ Índice de fecha creado');
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await databases.createIndex(
                database.$id,
                ventasCollection.$id,
                'folio_index',
                'key',
                ['folio']
            );
            console.log('✅ Índice de folio creado');
            
        } catch (error) {
            console.error('❌ Error creando índices:', error.message);
        }
        
        console.log('\n🎉 ¡Configuración completada!');
        console.log('\n📝 Agrega estos valores a tu archivo .env:');
        console.log(`APPWRITE_DATABASE_ID=${database.$id}`);
        console.log(`APPWRITE_COLLECTION_VENTAS_ID=${ventasCollection.$id}`);
        
    } catch (error) {
        console.error('❌ Error en la configuración:', error);
    }
}

// Ejecutar configuración
setupAppwrite();
