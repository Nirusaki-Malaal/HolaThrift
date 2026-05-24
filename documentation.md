# HolaThrift Documentation

## What HolaThrift Is

HolaThrift is an online thrift store for rare vintage and streetwear pieces. Every product is treated like a one-of-one item. A customer can browse the archive, save favorite items, add available pieces to a bag, pay online, and track delivery.

The site runs as a React app in the browser and an Express API on the server.

## Main Parts

## Frontend

The frontend lives in `src`.

It handles:

- The landing page
- The product archive
- Login and signup modals
- The cart and checkout modal
- User profile pages
- Saved items
- Admin product management
- Toast messages
- The Three.js hero background

The main screen is loaded from `src/app/shop/page.tsx`.

## Backend

The backend lives in `server`.

It handles:

- User signup and login
- Email OTP verification
- User profile updates
- Product data
- Admin product changes
- Image uploads
- Order reservation
- Cashfree payment setup and verification
- Shiprocket delivery creation and tracking

The API starts from `server/index.ts`.

## Database

MongoDB stores:

- Users
- Products
- Orders

Redis is used for temporary data:

- OTP codes
- Login sessions
- Product cache
- Reservation locks
- Shiprocket auth token cache

## How A Customer Uses The Site

1. The customer opens `holathrift.in`.
2. The landing page loads with the animated background.
3. The customer opens the archive.
4. The archive loads products from MongoDB.
5. The customer can search, filter, open details, save items, and add products to the bag.
6. At checkout, the customer enters or reuses a saved delivery address.
7. The server reserves the selected products for a short time.
8. Cashfree opens a secure payment checkout.
9. The server verifies the payment with Cashfree.
10. Paid items become sold.
11. Shiprocket receives the delivery order.
12. The customer can track the order from the profile page.

## How Signup And Login Work

Signup:

1. The user enters email, phone, and password.
2. The server checks for duplicate email or phone.
3. The password is hashed.
4. An OTP is emailed.
5. The OTP is stored temporarily in Redis.
6. When the OTP is verified, the user account is created.

Login:

1. The user enters email and password.
2. The server checks the password.
3. An OTP is emailed.
4. The OTP is verified.
5. The server creates a JWT session token.
6. The frontend stores the token in a cookie.

## User Features

Users can:

- Update display name
- Update phone number
- Change email with OTP verification
- Change password
- Save a delivery address
- Save products to a wishlist
- View order history
- Track Shiprocket delivery updates

## Admin Features

Admins can:

- Add products
- Upload product images
- Edit product details
- Mark products as sold or available
- Delete products

Admin access is checked on the server. The frontend only shows the admin panel when the server says the current user is an admin.

## Product Flow

Products are stored in MongoDB. There are no hardcoded seed products.

Each product has:

- Name
- Category
- Price
- Size
- Condition
- Image
- Description
- Status

Status can be:

- Available
- Reserved
- Sold

Reserved means someone has started checkout and the item is temporarily held.

## Checkout Flow

Checkout has three important steps.

1. Reserve products
2. Pay through Cashfree
3. Verify payment and create delivery

The server does not trust the frontend price. It checks product prices again from MongoDB before creating the payment order.

## Cashfree

Cashfree is used for online payment.

The server creates a Cashfree order and sends the payment session ID to the frontend. The frontend opens the Cashfree checkout. After checkout, the server checks Cashfree again to confirm the order is paid.

Cashfree mode can be sandbox or production through environment variables.

## Shiprocket

Shiprocket is used for delivery.

The server can:

- Check if a PIN code is serviceable
- Create a shipping order after payment
- Track a shipment by shipment ID or AWB

The profile page shows courier status and tracking events when available.

## Security Basics

The API includes:

- Helmet security headers
- CORS allowlist
- Rate limits
- Hashed passwords
- OTP based login
- Server side admin checks
- Safer image upload validation
- Git ignored `.env` secrets

Production must use a real `JWT_SECRET`.

## Environment Files

Use `.env.example` as the template.

Create a local `.env` file for real values. Do not commit `.env`.

Important values include:

- `MONGO_URI`
- `REDIS_URL`
- `JWT_SECRET`
- `ADMIN_EMAILS`
- `CASHFREE_APP_ID`
- `CASHFREE_SECRET_KEY`
- `SHIPROCKET_EMAIL`
- `SHIPROCKET_API_KEY`
- `CLIENT_ORIGINS`

## SEO Files

The project includes:

- Metadata in `index.html`
- `robots.txt`
- `sitemap.xml`
- `site.webmanifest`
- `og-image.svg`
- `humans.txt`
- `llms.txt`

These help search engines, social previews, humans, and AI tools understand the site.

## Running The App

The frontend and backend run separately during development.

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run server
```

Production build:

```bash
npm run build
```

## Useful Checks

```bash
npm run lint
npm run build
npx tsc --ignoreConfig --noEmit --target ES2023 --module esnext --moduleResolution bundler --types node --skipLibCheck --allowSyntheticDefaultImports server/index.ts
```
