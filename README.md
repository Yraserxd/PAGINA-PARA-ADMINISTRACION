# 📊 Dashboard de Ventas - Retailbase + Appwrite

Sistema para administrar ventas recibidas via webhooks de Retailbase usando Appwrite como backend.

## 🚀 Stack Tecnológico
- **Frontend**: HTML/CSS/JavaScript vanilla
- **Backend**: Node.js + Express (webhooks)
- **Base de datos**: Appwrite
- **Hosting**: Netlify/Vercel

## 📁 Estructura del Proyecto
```
sales-dashboard/
├── frontend/           # Dashboard web
│   ├── index.html
│   ├── styles.css
│   └── script.js
├── backend/            # API para webhooks
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── appwrite-config/    # Configuración de Appwrite
│   └── setup.js
└── README.md
```

## 🔧 Configuración
1. Configurar Appwrite
2. Configurar webhook en Retailbase
3. Desplegar backend para recibir webhooks
4. Desplegar frontend

## 📈 Funcionalidades
- Dashboard de ventas en tiempo real
- Lista de transacciones
- Gráficos de ventas
- Filtros por fecha/producto
- Detalles de cada venta
