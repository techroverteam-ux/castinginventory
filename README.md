# Casting Inventory

Multi-client casting inventory management system with role-based access control.

## Features

- **Multi-tenant**: Each client has their own inventory, categories, and users
- **Role Management**: Superadmin → Admin → Manager → Viewer hierarchy
- **Client Logos**: Each client can have their own branding/logo displayed in sidebar
- **Inventory Tracking**: Items with SKU, quantity, weight, material, status
- **Categories**: Organize items by category per client
- **Validation**: Full client + server-side validation on all forms
- **Dark Mode**: Full dark/light theme support
- **Responsive**: Mobile-first with bottom nav, tablet sidebar

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing

## Setup

```bash
# Install dependencies
npm install

# Configure environment
# Edit .env.local with your MongoDB URI and JWT secret

# Seed superadmin
npm run seed

# Run development server
npm run dev
```

## Default Superadmin

- Email: admin@castinginventory.com
- Password: admin123

## Role Hierarchy

| Role | Permissions |
|------|------------|
| Superadmin | Full access, manage clients, manage all users |
| Admin | Manage users within their client, full inventory access |
| Manager | Add/edit inventory items and categories |
| Viewer | Read-only access to inventory |

## Git Setup

```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:techroverteam-ux/castinginventory.git
git push -u origin main
```
