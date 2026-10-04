# GitHub Pages Deployment Guide — AchieveX 360

AchieveX 360 is designed for dual-mode deployment:
1. **Full-Stack PHP + MySQL Server** (XAMPP / Apache / Nginx)
2. **Static Web Server / GitHub Pages** (using `index.html` with client-side SheetJS & LocalStorage)

---

## 🚀 Deploying to GitHub Pages

### Step 1: Push Code to GitHub Repository

```bash
git init
git add .
git commit -m "Initial commit of AchieveX 360 Excel-Driven Dashboard"
git branch -M main
git remote add origin https://github.com/USERNAME/AchieveX-360.git
git push -u origin main
```

### Step 2: Ensure `.nojekyll` File Exists

To prevent GitHub Pages' Jekyll build engine from hiding folders starting with underscores or asset files, make sure the `.nojekyll` file is in the root directory.

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub.
2. Click **Settings** > **Pages** (in the sidebar).
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` / `/ (root)`.
4. Click **Save**.

Your dashboard will be published at:
`https://USERNAME.github.io/AchieveX-360/`

---

## 🔒 Notes on Client-Side vs PHP Mode on GitHub Pages

- On GitHub Pages, static `.html`, `.css`, and `.js` files run entirely inside the user's web browser.
- **Excel parsing, dynamic period detection, filter calculations, and local persistence** function 100% offline via `SheetJS` and `LocalStorage`.
- PHP API calls (`api/data.php`) will gracefully fallback to browser memory.
