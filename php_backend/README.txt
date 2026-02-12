DEPLOYMENT INSTRUCTIONS FOR HOSTINGER BUSINESS WEB HOSTING
==========================================================

1. DATABASE SETUP
-----------------
   a. Log in to Hostinger hPanel -> Databases -> MySQL Databases.
   b. Create a new Database, User, and Password.
   c. Open phpMyAdmin for that database.
   d. Import the `database.sql` file provided in this folder.

2. API UPLOAD
-------------
   a. Open File Manager in Hostinger.
   b. Navigate to `public_html`.
   c. Create a folder named `api`.
   d. Upload all files from `php_backend/api/` (config.php, auth.php, etc.) into `public_html/api/`.
   e. EDIT `public_html/api/config.php`:
      - Update $host, $db_name, $username, $password with your Hostinger DB details from step 1.
      - Update GEMINI_API_KEY with your real key.

3. FRONTEND DEPLOYMENT
----------------------
   a. Build your React app locally: `npm run build`
   b. Upload the contents of your `dist` folder (index.html, assets, etc.) to `public_html`.
      (Do not overwrite the `api` folder you just created).

4. ROUTING FIX (.htaccess)
--------------------------
   a. Create a file named `.htaccess` in `public_html` (if not exists).
   b. Add the following content to handle React Router refresh:

   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>

5. TESTING
----------
   - Visit your domain. Login should work via `api/auth.php`.
   - Projects should load via `api/projects.php`.
