# Odessi API — Spring Boot Backend

Phase 3 foundation for the [Odessi.tfi](https://odessi.tfi) e-commerce platform.

## Requirements

| Tool       | Version    |
|------------|------------|
| Java JDK   | 21+        |
| PostgreSQL | 14+        |
| Maven      | Via `mvnw` (no system install needed) |

> Java 25 is installed on this machine and is backwards-compatible with Java 21 source level.

---

## Architecture

```
odessi-store/
├── (Next.js frontend)
└── backend/
    └── odessi-api/          ← You are here
        ├── src/main/java/com/odessi/api/
        │   ├── config/          CORS, Security, App properties
        │   ├── controller/      REST controllers
        │   ├── dto/             Request/Response DTOs
        │   │   ├── request/
        │   │   └── response/
        │   ├── entity/          JPA entities
        │   ├── exception/       Global error handling
        │   ├── mapper/          MapStruct mappers
        │   ├── repository/      Spring Data JPA
        │   ├── service/         Service interfaces
        │   └── service/impl/    Service implementations
        └── src/main/resources/
            ├── application.yml
            └── db/migration/    Flyway SQL migrations
```

---

## PostgreSQL Setup

```sql
-- Run as postgres superuser
CREATE USER odessi_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE odessi OWNER odessi_user;
GRANT ALL PRIVILEGES ON DATABASE odessi TO odessi_user;
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values:

```bash
cp .env.example .env
```

| Variable          | Description                        | Default                              |
|-------------------|------------------------------------|--------------------------------------|
| `DB_URL`          | PostgreSQL JDBC URL                | `jdbc:postgresql://localhost:5432/odessi` |
| `DB_USERNAME`     | Database username                  | `odessi_user`                        |
| `DB_PASSWORD`     | Database password                  | —                                    |
| `SERVER_PORT`     | API server port                    | `8080`                               |
| `FRONTEND_URL`    | CORS allowed origin                | `http://localhost:3000`              |
| `SEED_DATA_ENABLED` | Run development seed data        | `true`                               |

---

## Running the Backend

### Windows (PowerShell)

```powershell
# Set JAVA_HOME first if needed
$env:JAVA_HOME = "C:\Program Files\Java\jdk-25.0.2"

# From backend/odessi-api directory:
$env:DB_URL="jdbc:postgresql://localhost:5432/odessi"
$env:DB_USERNAME="odessi_user"
$env:DB_PASSWORD="your_password"
$env:FRONTEND_URL="http://localhost:3000"

.\mvnw.cmd spring-boot:run
```

The API starts at: **http://localhost:8080**

---

## Maven Commands

```powershell
# Compile
.\mvnw.cmd compile

# Run tests
.\mvnw.cmd test

# Build JAR
.\mvnw.cmd package -DskipTests

# Run from JAR
java -jar target/odessi-api-0.1.0-SNAPSHOT.jar

# Clean build
.\mvnw.cmd clean package
```

---

## Database Migrations (Flyway)

Migrations run automatically on startup. Files live in:

```
src/main/resources/db/migration/
  V1__create_users.sql
  V2__create_products.sql
  V3__create_cart.sql
  V4__create_orders.sql
  V5__create_payments.sql
  V6__seed_development_data.sql
```

To run migrations manually (requires Maven + DB connection):

```powershell
.\mvnw.cmd flyway:migrate
```

---

## API Documentation

Swagger UI: **http://localhost:8080/swagger-ui.html**  
OpenAPI JSON: **http://localhost:8080/api-docs**

### Endpoint Summary

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/health` | Health check | Public |
| GET | `/api/products` | List products (filterable, paginated) | Public |
| GET | `/api/products/{slug}` | Product detail with variants | Public |
| GET | `/api/categories` | List categories | Public |
| GET | `/api/categories/{slug}` | Category detail | Public |
| GET | `/api/collections` | List collections | Public |
| GET | `/api/collections/{slug}` | Collection detail | Public |
| GET | `/api/cart` | Get cart | Phase 3: X-User-Id header |
| POST | `/api/cart/items` | Add to cart | Phase 3: X-User-Id header |
| PATCH | `/api/cart/items/{id}` | Update quantity | Phase 3: X-User-Id header |
| DELETE | `/api/cart/items/{id}` | Remove from cart | Phase 3: X-User-Id header |
| GET | `/api/wishlist` | Get wishlist | Phase 3: X-User-Id header |
| POST | `/api/wishlist/items` | Add to wishlist | Phase 3: X-User-Id header |
| DELETE | `/api/wishlist/items/{productId}` | Remove from wishlist | Phase 3: X-User-Id header |
| GET | `/api/addresses` | List addresses | Phase 3: X-User-Id header |
| POST | `/api/addresses` | Create address | Phase 3: X-User-Id header |
| PATCH | `/api/addresses/{id}` | Update address | Phase 3: X-User-Id header |
| DELETE | `/api/addresses/{id}` | Delete address | Phase 3: X-User-Id header |
| GET | `/api/orders` | List orders | Phase 3: X-User-Id header |
| GET | `/api/orders/{orderNumber}` | Order detail | Phase 3: X-User-Id header |

### Product Filter Parameters (GET /api/products)

```
category    — Category slug (e.g. "tees")
collection  — Collection slug (e.g. "dark-verse")
size        — Size label (e.g. "M")
color       — Color name (partial match)
minPrice    — Minimum price (INR)
maxPrice    — Maximum price (INR)
available   — true/false
featured    — true/false
bestseller  — true/false
newArrival  — true/false
search      — Text search in name/description
sort        — newest | featured | price_low | price_high | bestselling
page        — Page number (0-indexed, default: 0)
size        — Page size (default: 20, max: 100)
```

### Phase 3 Auth Note

Cart, wishlist, address, and order endpoints use `X-User-Id` header for development:

```bash
curl -H "X-User-Id: 1" http://localhost:8080/api/cart
```

⚠️ **This is development-only.** Phase 4 replaces this with JWT authentication.

---

## Database Tables

| Table | Description |
|-------|-------------|
| `users` | Registered users |
| `categories` | Product categories |
| `collections` | Curated collections |
| `products` | Product catalog |
| `product_variants` | SKU-level variants (size × color) |
| `carts` | User shopping carts |
| `cart_items` | Items in carts |
| `wishlists` | User wishlists |
| `wishlist_items` | Products in wishlists |
| `addresses` | Saved shipping addresses |
| `orders` | Placed orders |
| `order_items` | Line items with price/product snapshots |
| `payments` | Payment records (Razorpay in Phase 4) |

---

## Tests

```powershell
# Run all tests
.\mvnw.cmd test

# Run specific test class
.\mvnw.cmd test -Dtest=ProductServiceTest

# Run with coverage report
.\mvnw.cmd test jacoco:report
```

Test profile (`spring.profiles.active=test`) uses H2 in-memory database.  
Integration tests with Testcontainers (real PostgreSQL) are scaffolded for Phase 4.

---

## What's Next — Phase 4

- JWT authentication (Spring Security + JJWT)
- User registration and login endpoints
- Razorpay payment integration
- Complete order creation flow
- Cart → Checkout → Payment → Order → Inventory decrement
- Admin endpoints (`/api/admin/**`)
- Email notifications (order confirmation)

---

## Known Limitations (Phase 3)

- Authentication is mocked via `X-User-Id` header — not production-safe
- Order creation not yet implemented (requires payment provider)
- No email service
- No inventory transaction log
- Razorpay not integrated
- Admin endpoints blocked (`/api/admin/**` returns 403)
