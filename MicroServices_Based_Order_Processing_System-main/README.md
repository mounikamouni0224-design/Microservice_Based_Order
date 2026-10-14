# OrderFlow

OrderFlow is a full-stack order management application. A React dashboard
connects to four Spring Boot REST services for customers, products, orders,
and notifications. Each service persists data in its own MySQL database.
The order service calls the customer, product, and notification services
over HTTP.

## Features

- Dashboard with order, inventory, customer, and notification metrics.
- CRUD operations for customers, products, orders, and notifications.
- Product stock adjustment endpoints.
- Order processing that checks related service data, updates product stock,
  and creates notifications.
- Docker Compose configuration for the backend services and databases.

## Architecture

| Component | Responsibility | Port |
| --- | --- | ---: |
| React dashboard | Vite development server | `5173` |
| Customer service | Customer REST API | `8081` |
| Product service | Product REST API and stock | `8082` |
| Order service | Order REST API and orchestration | `8083` |
| Notification service | Notification REST API | `8084` |
| Customer MySQL | Customer database | `3307` |
| Product MySQL | Product database | `3308` |
| Order MySQL | Order database | `3309` |
| Notification MySQL | Notification database | `3310` |

The database ports listed above are host ports. Each MySQL container listens
on port `3306`. The databases are named `customer_db`, `product_db`,
`order_db`, and `notification_db`.

During development, Vite proxies the four `/api/...` paths to their matching
backend services. Docker Compose starts the backend services and databases;
the frontend is started separately.

## Technology

- Frontend: React 18, Vite 6, Tailwind CSS 4, Axios, and Lucide icons.
- Backend: Java 25, Spring Boot 4.1.1, Spring Web, Spring Data JPA,
  Jakarta Validation, and Maven.
- Database: MySQL 8.
- Backend orchestration: Docker Compose.

## Prerequisites

- Docker Desktop or Docker Engine with the Docker Compose plugin.
- Node.js and npm.
- JDK 25 if building or running backend services outside Docker.

## Run locally

### Start the backend

From the repository root, run:

```bash
docker compose -f microservices-order-system/docker-compose.yml up --build
```

Compose builds and starts all four backend services and their MySQL databases.
Each service waits for its own database health check. The order service also
depends on the other three services.

### Start the dashboard

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

### Stop the backend

From the repository root:

```bash
docker compose -f microservices-order-system/docker-compose.yml down
```

The named MySQL volumes are retained when containers stop. Adding
`--volumes` to the `down` command removes those volumes and deletes their
local database data.

## REST API

All services support listing, retrieving by ID, creating, updating, and
deleting their resources:

| Resource | Base URL |
| --- | --- |
| Customers | `http://localhost:8081/api/customers` |
| Products | `http://localhost:8082/api/products` |
| Orders | `http://localhost:8083/api/orders` |
| Notifications | `http://localhost:8084/api/notifications` |

For each base URL, the API supports:

- `GET /` to list resources.
- `GET /{id}` to retrieve one resource.
- `POST /` to create a resource.
- `PUT /{id}` to update a resource.
- `DELETE /{id}` to delete a resource.

The product service additionally supports:

- `PUT /api/products/{id}/reduce-stock?quantity={quantity}`
- `PUT /api/products/{id}/increase-stock?quantity={quantity}`

The endpoints use JSON request and response bodies where applicable. Consult
each service's DTO classes for the request fields and validation rules.

## Configuration

### Frontend

`frontend/.env.example` lists the available Vite variables. To override local
defaults, copy it to `frontend/.env` from the frontend directory:

```bash
cp .env.example .env
```

Development proxy target variables:

- `VITE_CUSTOMER_SERVICE_URL` (default `http://localhost:8081`)
- `VITE_PRODUCT_SERVICE_URL` (default `http://localhost:8082`)
- `VITE_ORDER_SERVICE_URL` (default `http://localhost:8083`)
- `VITE_NOTIFICATION_SERVICE_URL` (default `http://localhost:8084`)

For a production frontend build, the API clients can use complete API URLs
instead:

- `VITE_CUSTOMER_API_URL`
- `VITE_PRODUCT_API_URL`
- `VITE_ORDER_API_URL`
- `VITE_NOTIFICATION_API_URL`

Vite variables are embedded at build time. Do not put secrets in frontend
variables.

### Backend

Each service reads database settings from `JDBC_DATABASE_URL`,
`JDBC_DATABASE_USERNAME`, and `JDBC_DATABASE_PASSWORD`. The order service
also reads `CUSTOMER_SERVICE_URL`, `PRODUCT_SERVICE_URL`, and
`NOTIFICATION_SERVICE_URL`.

Docker Compose supplies database and service URLs for its internal network.
The current Compose configuration uses development credentials; replace
them and use an appropriate secrets mechanism outside local development.

## Build and test

Build the frontend production bundle:

```bash
cd frontend
npm run build
```

Preview the bundle locally:

```bash
npm run preview
```

Each backend service includes a Maven wrapper. From a service directory,
run tests with:

```bash
./mvnw test
```

On Windows PowerShell, use:

```powershell
.\mvnw.cmd test
```

The repository currently contains Java test sources in the order and
product services.

## Repository layout

```text
.
|-- frontend/
|   |-- src/
|   |   |-- components/       Dashboard and resource views
|   |   |-- hooks/            Shared service data loading
|   |   `-- services/         HTTP API clients
|   |-- .env.example
|   `-- package.json
`-- microservices-order-system/
    |-- docker-compose.yml
    |-- customer-service/
    |-- product-service/
    |-- order-service/
    `-- notification-service/
```
