# Function Console Practice Wrapper

A static, browser-only coding practice UI that resembles a generic cloud function editor. It lets you work through a curated subset of NeetCode-style practice problems without placing problem names front-and-center while you are in public.

## Features

- Cloud-function-style editor, toolbar, function explorer, configuration panel, and execution output.
- Problem prompt context appears as code comments and reference links open the original LeetCode pages.
- Local JavaScript test runner for sample events.
- `Save` marks a problem complete after tests run and stores progress in `localStorage`.
- Focus mode blurs problem names in the left navigation until selected or hovered.
- GitHub Pages workflow included in `.github/workflows/pages.yml`.

## Running locally

Open `index.html` in a browser, or serve the folder with any static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. In the repository settings, enable **Pages** with **GitHub Actions** as the source.
3. Push to the `main` branch or run the `Deploy static app to GitHub Pages` workflow manually.

The app is fully static and does not submit to LeetCode or NeetCode. Use the reference link when you want to submit on the original platform.
