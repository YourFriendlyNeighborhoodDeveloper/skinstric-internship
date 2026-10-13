# Skinstric

A Next.js application implementing the three phases in the [Skinstric technical specification](https://drive.google.com/file/d/1M91c7SEBn1XphnbRW30t3702e6k_H5tc/view): submit a name and location, upload a photo or take a selfie, and review simulated demographic results.

Results are sorted by confidence and displayed as percentages with two decimal places. Selecting an actual attribute updates the corresponding category card and confidence display without changing the API scores. Selections can be reset.

After analysis, four diamond tiles open Demographics, Cosmetic Concerns, Skin Type Details, and Weather. Every module uses the same results screen: estimated categories sorted by confidence, an editable "actual" selection for each category, and a reset. Selections stay in the in-memory session while moving between modules.

## Submission links

- Live application: [https://skinstric-internship-two.vercel.app](https://skinstric-internship-two.vercel.app)
- Repository: [https://github.com/YourFriendlyNeighborhoodDeveloper/skinstric-internship](https://github.com/YourFriendlyNeighborhoodDeveloper/skinstric-internship)

## Stack

JavaScript, React 19, Next.js 16 App Router, Tailwind CSS 4, Lucide icons, and native Canvas and MediaDevices APIs. Playwright provides browser tests; Node's test runner verifies validation and result contracts.

## Run locally

Use Node.js 20.9 or newer.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No API key or environment variables are required.

## API integration

Requests are sent directly from the browser to `https://us-central1-frontend-simplified.cloudfunctions.net`:

- `POST /skinstricPhaseOne` sends `{ "name": "John Doe", "location": "New York" }`.
- `POST /skinstricPhaseTwo` sends `{ "image": "raw_base64_string" }` for both uploads and selfies.

The live service requires lowercase `image`. The PDF's uppercase `Image` field returns `{ "success": false, "message": "Image is required." }`. The integration uses the verified live contract. Successful responses contain `success: true`; image responses also contain `data.race`, `data.age`, and `data.gender`.

Validation accepts Unicode letters, combining marks, spaces, and common punctuation, including mononyms and accented locations. Empty values, numeric characters, control characters, unsupported symbols, and values over 100 characters are rejected. The specification excludes numbers from both fields.

Uploads accept JPEG, PNG, and WebP up to 10 MB. Photos are decoded and converted to JPEG, with their longest edge limited to 1600 pixels. Canvas conversion removes the original file metadata. Requests time out after 30 seconds and are canceled when the requesting screen is left. Failed requests remain recoverable without creating results.

The browser keeps profile details, scores, and selections only in memory. Refreshing starts a new session. Photos are cleared after successful analysis or leaving their screen; they are not stored in localStorage, sessionStorage, or a database. Camera tracks stop after capture, when navigating away, and when the page is hidden. Late camera permission results are released. Camera access requires HTTPS or localhost.

The API returns randomized demo predictions. These are not verified medical or biometric measurements. Phase Two only returns race, age, and gender, so the Cosmetic Concerns (concern, severity, area), Skin Type Details (skin type, hydration, sensitivity), and Weather (conditions, temperature, humidity) estimates are randomized in the same format when Phase Two succeeds. No estimates are created when it fails. Photos are sent to the external service only when the user chooses “Use this photo”; this project does not control the service's retention policy.

## Tests

```sh
npx playwright install chromium webkit
npm run lint
npm test
npm run build
npm run test:e2e
```

Browser tests run against the production build on port 3100. They cover navigation, field validation, request payloads, retry and error states, image decoding and resizing, selfie capture and cleanup, spinning photo-option diamonds and reduced motion, the four analysis tiles and their modules, module selection persistence, score sorting and formatting, attribute selection, session recovery, and layouts at 320, 768, and 1440 pixels. API mocks exist only in the tests.

Chromium's native fake camera verifies capture and stream cleanup on desktop and mobile emulation. WebKit covers upload, navigation, errors, results, and responsive layouts; its two native fake-camera cases are explicitly skipped.

To exercise the real APIs with generated images and a fake camera, run:

```sh
npm run test:live
```

This sends test profile data and images to the external service. Physical cameras and actual mobile devices still require manual verification.

## Deployment

The production application is deployed to Vercel, with the GitHub repository connected and `main` as the production branch. The public URL above is accessible without Vercel authentication.

Import the repository into Vercel, choose Next.js, use `npm ci` for installation and `npm run build` for the build, and deploy over HTTPS. No secrets are needed. For a Node.js host, run `npm run build` followed by `npm start`.

Validation of the current revision against the local production build passed: lint, the production build, six contract tests, and 58 browser tests across Chromium, mobile Chromium, and WebKit. Two WebKit native fake-camera tests were explicitly skipped. The public deployment and the real Skinstric API tests (`npm run test:live`) still need to be re-run for this revision; they last passed for the previous submission. Physical-camera and Figma checks remain unverified as listed below.

The production dependency audit reports no vulnerabilities. The development lint dependency chain contains an unresolved `braces` advisory ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)); the registry currently has no patched release. Do not use an automatic forced downgrade of Next.js to address it.

## Visual verification

Styling is provisional, based on the [public interface provided for reference](https://skintric.vercel.app). The official Figma file was not supplied. Exact typography, dimensions, spacing, animation, hover behavior, and design breakpoints remain pending comparison with that file.

The following manual checks remain unverified:

- On a physical desktop camera and actual iOS/Android devices, verify camera permission allow/deny and retry, front-camera preview, capture, retake, submission, and upload fallback.
- Confirm the physical camera indicator turns off after capture, navigation, and backgrounding the page, including returning from a delayed permission prompt.
- Compare desktop and mobile screens with the official Figma file, including fonts, spacing, dimensions, breakpoints, hover states, and motion.

Automated fake-camera and responsive browser tests do not establish that these physical-device or Figma checks passed.
