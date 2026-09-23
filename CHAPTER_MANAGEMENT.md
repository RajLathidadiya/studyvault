# StudyVault — Chapter Management

## Add a new chapter
1. Open `/admin`.
2. Click **Subjects** in the Admin Console.
3. Select **GSEB or CBSE**.
4. Select **Physics, Chemistry, Mathematics, or Biology**.
5. Enter the new chapter name.
6. Click **+ Add chapter**.

The chapter is stored in the browser under `studyvault_custom_chapters`, appears in the Question form's Chapter dropdown, and is also surfaced on the matching student subject page in the same browser.

## Important
This version uses browser storage for custom chapters. For production, custom chapters should be moved to the Supabase `chapters` table so all devices and students see the same chapter list.
