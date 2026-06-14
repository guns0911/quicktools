# QuickTools — Free Online Image Tool

A browser-based (serverless) image compressor, resizer and format converter.
Built for passive income via free hosting + Google AdSense.

- **Cost:** $0 (free hosting, no API, no server)
- **Tech:** Plain HTML + CSS + JavaScript (no build step)
- **Privacy:** Files never leave the user's device

---

## 1) Preview locally (optional)

Open a terminal in this folder and run:

```
npx serve .
```

Open the shown address (e.g. http://localhost:3000) in your browser. If you don't have
`npx`, double-clicking `index.html` also works for most features.

---

## 2) Publish for free (GitHub Pages — recommended)

This is automated via the GitHub CLI, but you can also do it manually:

1. Create a repository on https://github.com (e.g. `quicktools`), set it **Public**.
2. Upload all files from this folder to the repo.
3. Go to **Settings → Pages**.
4. Under **Source**, select the `main` branch and the `/root` folder → **Save**.
5. After a few minutes your site is live at:
   `https://USERNAME.github.io/quicktools/`

> Alternative: https://vercel.com or https://app.netlify.com — drag & drop the folder
> for instant hosting. Both are free.

---

## 3) The income part: Google AdSense

AdSense shows ads and starts paying after it reviews and approves your site.

1. Once your site has some content and traffic, go to https://adsense.google.com.
2. Add your site's address and create your account.
3. AdSense gives you a **publisher code** (`ca-pub-XXXXXXXXXXXXXXXX`).
4. In `index.html`, find the comment that starts with `AdSense:`, uncomment it and
   replace `XXXX...` with your own publisher ID.
5. Create an ad unit in the AdSense panel and paste its code into the
   `<div class="ad-slot">...</div>` areas.
6. Approval usually takes a few days to a few weeks. After approval, ads appear automatically.

**AdSense approval requirements (already in place in this project):**
- ✅ Privacy Policy page (`privacy.html`)
- ✅ About page (`about.html`)
- ✅ Real, useful content and FAQ
- ⚠️ Some organic traffic (see growth steps below)

---

## 4) Traffic = income: growth steps

Ad revenue comes from visitors. To rank:

1. Add the site to **Google Search Console** (free) and submit your `sitemap.xml`.
2. Share the tool on social media (Reddit, forums, X/Twitter) with people who need
   free image compression.
3. Each new tool you add = new keywords = new traffic. (Next up: PDF tools, QR code generator.)

---

## File structure

```
index.html      → Home page + image tool
app.js          → Image processing logic (in-browser)
styles.css      → Styling
about.html      → About page (required for AdSense)
privacy.html    → Privacy policy (required for AdSense)
robots.txt      → Search engine rules
sitemap.xml     → Sitemap (update to your live address)
```

> Before publishing, replace `quicktools.example.com` in `index.html`, `sitemap.xml`
> and `robots.txt` with your real address.
