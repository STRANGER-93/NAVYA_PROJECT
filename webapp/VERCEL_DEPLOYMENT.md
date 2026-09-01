# Deploy NAVYA to Vercel

This is a Vite static site. Vercel uses `npm run build` and publishes the `dist` directory, as configured in `vercel.json`.

## Important: APK hosting

`public/navya.apk` is 118 MB. It exceeds the 100 MB static-file upload limit on Vercel Hobby and cannot be pushed to GitHub, which has a 100 MB per-file limit.

For a free Git-based Vercel deployment, upload the APK to a public download host that supports direct downloads (for example, Cloudflare R2, Amazon S3, or a GitHub Release asset) and set the resulting direct URL as `VITE_NAVYA_APK_URL` in Vercel. The download buttons then use that URL.

For Vercel Pro, direct CLI deployment can upload the APK because the static file-upload limit is 1 GB. Do not commit the APK to GitHub.

## Dashboard deployment (recommended)

1. Create a GitHub repository and push this `webapp` folder, excluding `public/navya.apk`.
2. In Vercel, select **Add New → Project**, import the repository, and set the root directory to `webapp` if the repository contains the larger WOMEN_WELLNESS project.
3. Vercel should detect **Vite**. Confirm Build Command is `npm run build` and Output Directory is `dist`.
4. Under **Environment Variables**, add `VITE_NAVYA_APK_URL` with the direct public URL to the uploaded APK. Enable it for Production (and Preview if desired).
5. Click **Deploy**. Vercel will provide a public URL.

## CLI deployment

From this folder, run:

```powershell
npm install -g vercel
vercel
vercel --prod
```

For the Pro direct-upload route, run those commands with `public/navya.apk` present. For Hobby, use the external APK URL described above and exclude `public/navya.apk` before deploying.
