# Desaborad Dinero

**Desaborad Dinero** es una aplicación web de finanzas personales diseñada para ayudar a organizar ingresos, gastos fijos, gastos diarios y ahorro de forma simple y visual.

La app permite registrar cada pago recibido, convertir ingresos en dólares a colones, calcular automáticamente gastos fijos, separar un porcentaje de ahorro y mostrar cuánto dinero queda disponible hasta el próximo pago.

## Objetivo del proyecto

El objetivo principal de este proyecto es ayudar al usuario a mejorar su orden financiero mediante un dashboard que responda preguntas como:

* ¿Cuánto dinero recibí?
* ¿Cuánto debo separar para gastos fijos?
* ¿Cuánto puedo ahorrar?
* ¿Cuánto dinero tengo disponible?
* ¿Cuánto puedo gastar por día hasta el próximo pago?
* ¿Voy bien o estoy gastando demasiado rápido?

## Características principales

* Autenticación de usuarios con Supabase.
* Cada usuario administra sus propios datos.
* Registro de pagos en dólares.
* Conversión automática de USD a CRC usando el tipo de cambio ingresado por el usuario.
* Soporte para pagos mensuales, quincenales, semanales o personalizados.
* Cálculo automático de:

  * ingreso en colones;
  * gastos fijos;
  * ahorro;
  * dinero disponible;
  * límite diario recomendado.
* Gestión de gastos fijos:

  * agregar;
  * editar;
  * eliminar.
* Registro de gastos diarios.
* Eliminación de gastos diarios.
* Semáforo financiero:

  * verde: buen estado;
  * amarillo: cuidado con los gastos;
  * rojo: alerta de poco dinero disponible.
* Historial de presupuestos.
* Próximos pagos basados en los gastos fijos registrados.
* Base de datos en Supabase.
* Diseño responsive con Tailwind CSS.

## Tecnologías utilizadas

* React
* Vite
* Tailwind CSS
* Supabase
* JavaScript
* Git
* GitHub
* Vercel

## Estructura general del proyecto

```text
desaborad-dinero/
│
├── src/
│   ├── components/
│   │   ├── FixedExpensesCard.jsx
│   │   ├── MonthlyHistory.jsx
│   │   └── UpcomingPayments.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── RegisterPayment.jsx
│   │   └── DailyExpenses.jsx
│   │
│   ├── lib/
│   │   └── supabaseClient.js
│   │
│   ├── utils/
│   │   └── financeCalculations.js
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env.example
├── package.json
└── README.md
```

## Instalación y ejecución local

Clonar el repositorio:

```bash
git clone https://github.com/Alecam25/Desaborad-dinero.git
```

Entrar al proyecto:

```bash
cd Desaborad-dinero
```

Instalar dependencias:

```bash
npm install
```

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Ejecutar el proyecto:

```bash
npm run dev
```

Abrir en el navegador:

```text
http://localhost:5173
```

## Variables de entorno

El proyecto usa Supabase para autenticación y base de datos.

Ejemplo de archivo `.env.example`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

> Nota: el archivo `.env` no debe subirse a GitHub.

## Base de datos

El proyecto utiliza las siguientes tablas principales en Supabase:

### fixed_expenses

Guarda los gastos fijos de cada usuario.

Campos principales:

* id
* user_id
* name
* amount
* currency
* due_day
* category
* is_active
* created_at

### monthly_cycles

Guarda cada presupuesto creado por el usuario.

Campos principales:

* id
* user_id
* month
* payment_date
* next_payment_date
* pay_frequency
* days_until_next_payment
* salary_usd
* exchange_rate
* salary_crc
* fixed_expenses_total
* saving_percentage
* saving_amount
* available_amount
* daily_limit
* financial_status
* created_at

### daily_expenses

Guarda los gastos diarios asociados a un presupuesto.

Campos principales:

* id
* user_id
* cycle_id
* expense_date
* category
* description
* amount
* payment_method
* created_at

## Seguridad

La aplicación utiliza Row Level Security en Supabase para asegurar que cada usuario solo pueda acceder a su propia información.

Cada registro se asocia al usuario autenticado mediante el campo:

```text
user_id
```

Esto permite que distintos usuarios usen la misma aplicación sin compartir datos entre ellos.

## Flujo principal de uso

1. El usuario crea una cuenta o inicia sesión.
2. Registra sus gastos fijos.
3. Registra un pago recibido.
4. Ingresa el monto en dólares y el tipo de cambio.
5. Selecciona la fecha de pago y la fecha del próximo pago.
6. Define el porcentaje de ahorro.
7. La app calcula automáticamente el presupuesto.
8. Durante el periodo, el usuario registra sus gastos diarios.
9. El dashboard muestra el disponible actual y el estado financiero.

## Cálculos principales

```text
Ingreso CRC = salario USD × tipo de cambio
```

```text
Gastos fijos totales = gastos en CRC + gastos en USD convertidos a CRC
```

```text
Ahorro = dinero después de gastos fijos × porcentaje de ahorro
```

```text
Disponible = ingreso CRC - gastos fijos - ahorro
```

```text
Límite diario = disponible / días hasta el próximo pago
```

## Próximas mejoras

* Gráficos de gastos por categoría.
* Barra de progreso del presupuesto.
* Exportar reportes a PDF o Excel.
* Modo claro y oscuro.
* Mejoras en diseño móvil.
* Edición de presupuestos anteriores.
* Metas de ahorro.
* Notificaciones o recordatorios de pagos.
* Dashboard comparativo entre meses.

## Autor

Desarrollado por **Alessandro Campos Bogantes**.

Proyecto creado como parte de mi portafolio de Ingeniería en Sistemas, con enfoque en desarrollo web, bases de datos, autenticación y lógica de negocio aplicada a finanzas personales.
