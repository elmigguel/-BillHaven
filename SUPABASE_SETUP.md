# Supabase Setup Guide for BillHaven

This guide will walk you through setting up your Supabase project for the BillHaven app.

## Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Sign in or create an account
3. Click "New Project"
4. Fill in the details:
   - **Name**: BillHaven
   - **Database Password**: (create a strong password and save it securely)
   - **Region**: Choose closest to your users
5. Click "Create new project" and wait for it to initialize (2-3 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, click on "Settings" (gear icon) in the left sidebar
2. Click on "API" under Project Settings
3. You'll see two important values:
   - **Project URL**: Something like `https://xxxxx.supabase.co`
   - **anon public key**: A long JWT token starting with `eyJ...`

4. Copy these values

## Step 3: Update Your .env File

1. Open `/home/elmigguel/BillHaven/.env`
2. Replace the placeholder values:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Run the Database Schema

1. In your Supabase dashboard, click on "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from your project
4. Paste it into the SQL editor
5. Click "Run" to execute the script
6. You should see: "Success. No rows returned"

This will create:
- `profiles` table (for user profiles and roles)
- `bills` table (for bill submissions)
- `platform_settings` table (for admin settings)
- `bill-documents` storage bucket (for receipt images)
- All necessary RLS policies
- Triggers for auto-updating timestamps
- Functions for role management

## Step 5: Verify the Setup

1. Click on "Table Editor" in the left sidebar
2. You should see three tables:
   - `profiles`
   - `bills`
   - `platform_settings`

3. Click on "Storage" in the left sidebar
4. You should see a bucket named `bill-documents`

## Step 6: Create Your First Admin User

1. Start your app locally: `cd /home/elmigguel/BillHaven && npm run dev`
2. Go to http://localhost:5173/signup
3. Create your first user account
4. After signup, go back to Supabase dashboard
5. Click on "Table Editor" > "profiles"
6. Find your user in the list
7. Double-click on the "role" cell for your user
8. Change it from "user" to "admin"
9. Click the checkmark to save

You now have admin access in the app!

## Step 7: Configure Storage Public Access

1. In Supabase dashboard, go to "Storage"
2. Click on "bill-documents" bucket
3. Click on "Policies" tab
4. Verify that the policies from the schema are applied:
   - "Authenticated users can upload bill documents"
   - "Bill owners can view their documents"
   - "Bill owners can delete their documents"

## Step 8: Test the Setup

1. Log in to your app with your admin account
2. Try creating a bill submission (with an image)
3. Check if it appears in the "My Bills" section
4. Go to "Review Bills" (admin only) and approve it
5. Check "Public Bills" to see if it appears

## Optional: Configure Additional Settings

### Enable Email Confirmations

1. Go to "Authentication" > "Settings" in Supabase
2. Under "Email Auth", you can enable:
   - Email confirmation (users must verify email)
   - Email change confirmation
   - Password recovery

### Set Up Email Templates

1. Go to "Authentication" > "Email Templates"
2. Customize the email templates for:
   - Confirmation email
   - Password recovery
   - Email change confirmation

### Configure Site URL

1. Go to "Authentication" > "URL Configuration"
2. Add your production URL when you deploy

## Troubleshooting

### Issue: Can't sign up or login
- Check that your SUPABASE_URL and SUPABASE_ANON_KEY are correct in .env
- Restart your dev server after changing .env
- Check browser console for errors

### Issue: "Row-level security" errors
- Make sure you ran the entire supabase-schema.sql
- Check that RLS is enabled on all tables
- Verify your user has a profile entry in the profiles table

### Issue: Can't upload images
- Check that the bill-documents bucket exists
- Verify storage policies are in place
- Check that the bucket is set to "public" access

### Issue: Bills not showing up
- Check the RLS policies on the bills table
- Verify your user_id matches the authenticated user
- Check the status of the bills (pending_approval, approved, etc.)

## Database Backup

It's recommended to set up automatic backups:

1. Go to "Database" > "Backups" in Supabase
2. Enable "Point in Time Recovery" (available on Pro plan)
3. Or manually export your data regularly using pg_dump

## Next Steps

- Update the .env file with your real Supabase credentials
- Run the schema SQL in Supabase
- Test all features of the app
- Set up payment processing with real wallet addresses
- Deploy to production (see DEPLOYMENT.md)
