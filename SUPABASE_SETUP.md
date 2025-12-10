# Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details:
   - Name: `stockmart` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
5. Wait for project to be created (2-3 minutes)

## 2. Get Your Supabase Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## 3. Configure Environment Variables

### Backend (.env)

Create a `.env` file in the `backend` directory:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 4. Test Connection

After setting up environment variables, restart your servers:

```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev
```

## 5. Next Steps

Once connected, you'll need to:

1. **Create your database tables** in Supabase SQL Editor
2. **Set up Row Level Security (RLS) policies** if needed
3. **Migrate your existing data** to Supabase
4. **Update your service methods** to use Supabase instead of in-memory arrays

## Important Notes

- **Never commit `.env` files** to version control
- **Service Role Key** should only be used on the backend, never in frontend code
- **Anon Key** is safe to use in frontend (with RLS policies)
- Keep your credentials secure and rotate them periodically



