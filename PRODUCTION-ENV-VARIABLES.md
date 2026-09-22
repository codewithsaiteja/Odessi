# Odessi.tfi — Production Environment Variables Reference

> [!IMPORTANT]
> Do NOT set `RAZORPAY_KEY_ID` or `RAZORPAY_KEY_SECRET` to LIVE mode until full production authorization and sign-off is completed. During Step 1 development & testing, Razorpay remains in **TEST mode** (`rzp_test_...`).

---

## 1. Frontend Environment Variables (`odessi-store`)

These variables are defined in `.env.local` or directly in hosting platforms (e.g., Vercel, Netlify, Docker).

| Variable Name | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:8080` | Public URL of the Spring Boot backend API. In production, set to `https://api.odessi.shop`. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Yes** | `rzp_test_R6F5qO3z4K8v...` | Razorpay Key ID for client-side Checkout Modal initialization. Must match backend `RAZORPAY_KEY_ID`. |

---

## 2. Backend Environment Variables (`backend/odessi-api`)

These variables are defined in `application.properties`, environment variables, or container configurations.

### Database (PostgreSQL)
| Variable Name | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `SPRING_DATASOURCE_URL` | **Yes** | `jdbc:postgresql://localhost:5432/odessi_db` | PostgreSQL JDBC connection URL. |
| `SPRING_DATASOURCE_USERNAME` | **Yes** | `postgres` | Database username. |
| `SPRING_DATASOURCE_PASSWORD` | **Yes** | `[SECURE_DB_PASSWORD]` | Database password. |
| `SPRING_FLYWAY_ENABLED` | No | `true` | Enables automatic Flyway schema migrations on startup. |

### Security & Authentication (JWT)
| Variable Name | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `JWT_SECRET` | **Yes** | `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970` | 256-bit secret key used to sign JWT auth tokens. |
| `JWT_EXPIRATION_MS` | No | `86400000` (24 Hours) | JWT token lifespan in milliseconds. |

### Payment Gateway (Razorpay)
| Variable Name | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `RAZORPAY_KEY_ID` | **Yes** | `rzp_test_...` | Razorpay API Key ID (TEST mode for development). |
| `RAZORPAY_KEY_SECRET` | **Yes** | `[SECURE_TEST_SECRET]` | Razorpay API Key Secret. |
| `RAZORPAY_WEBHOOK_SECRET` | **Yes** | `[SECURE_WEBHOOK_SECRET]` | Razorpay Webhook signature verification secret. |

### Server & Storage
| Variable Name | Required | Default / Example Value | Description |
| :--- | :---: | :--- | :--- |
| `SERVER_PORT` | No | `8080` | HTTP port on which Spring Boot listens. |
| `APP_MEDIA_STORAGE_DIR` | No | `./uploads` | Absolute path where product media uploads are stored. |
| `CORS_ALLOWED_ORIGINS` | **Yes** | `https://odessi.shop,http://localhost:3000` | Comma-separated allowed frontend origins for CORS. |

---

## 3. Environment Setup Steps

1. Copy `.env.example` to `.env.local` in `odessi-store`.
2. Configure `NEXT_PUBLIC_API_URL` to point to your deployed Spring Boot API domain.
3. Verify PostgreSQL database connection parameters in backend `application-prod.properties` or environment variables.
4. Verify Flyway migration history table (`flyway_schema_history`) applies up to `V16__add_product_lifecycle_status.sql`.
