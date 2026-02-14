# Local setup – fix “Login failed”

Login works only when the **PHP API** is running and the **database** exists.

## 1. Create the database

In MySQL (XAMPP/MAMP/phpMyAdmin or CLI), create the database:

```sql
CREATE DATABASE IF NOT EXISTS novalink;
```

If you use different DB name/user/password, update `secrets.php` in the project root (see `secrets.php.example`).

## 2. Start the API (required for login)

In a **separate terminal**, from the project root run:

```bash
npm run dev:api
```

Leave this running. You should see: `Development Server (http://localhost:8000) started`.

## 3. Start the frontend

In another terminal:

```bash
npm run dev
```

Open the URL shown (e.g. http://localhost:4567). Log in with:

- **Username / Email:** `admin`
- **Password:** `admin123`

If you see “Cannot reach the server…”, the API is not running — start it with `npm run dev:api`.
