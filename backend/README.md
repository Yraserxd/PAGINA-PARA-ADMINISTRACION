# 🚀 Backend - Dashboard de Ventas

Backend para recibir webhooks de Retailbase y gestionar ventas usando Appwrite.

## 📋 Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del backend con las siguientes variables:

```env
# Configuración del servidor
PORT=3000

# Configuración de Appwrite
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=tu_project_id_aqui
APPWRITE_API_KEY=tu_api_key_aqui
APPWRITE_DATABASE_ID=tu_database_id_aqui
APPWRITE_COLLECTION_VENTAS_ID=tu_collection_id_aqui
```

## 🛠️ Instalación

```bash
npm install
```

## 🚀 Ejecución

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📡 Endpoints

- `GET /` - Información del servidor
- `GET /health` - Estado del servidor
- `POST /webhook/venta` - Recibir webhooks de Retailbase
- `GET /api/ventas` - Obtener lista de ventas
- `DELETE /api/ventas/:id` - Eliminar una venta

## 🔧 Configuración de Appwrite

1. Crea un proyecto en Appwrite
2. Crea una base de datos
3. Crea una colección llamada "ventas"
4. Configura los permisos de la colección
5. Obtén las credenciales y configúralas en las variables de entorno

## 🚀 Despliegue

### Railway
El proyecto está configurado para Railway con `railway.json`

### Vercel
El proyecto está configurado para Vercel con `vercel.json`

## 🔍 Troubleshooting

Si el servidor no inicia, verifica:
1. Todas las variables de entorno están configuradas
2. Las credenciales de Appwrite son correctas
3. La base de datos y colección existen en Appwrite 