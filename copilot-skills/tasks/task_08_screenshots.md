Prompt: Create a React component that renders an App Store screenshot slide. The slide should show a phone mockup containing a device screenshot, a headline text above it, and support for theme presets and locale switching.

Verifier: Should contain a Phone mockup component with theme/locale support and headline

---

Baseline Output:
```tsx
const THEMES = {
  "clean-light": { bg: "#F6F1EA", fg: "#171717", accent: "#5B7CFA" },
  "dark-bold": { bg: "#0B1020", fg: "#F8FAFC", accent: "#8B5CF6" },
};

const LOCALES = ["en", "de", "es"] as const;

function ScreenshotSlide({ headline, screenshotSrc, themeId, locale }) {
  const theme = THEMES[themeId];
  const base = `/screenshots/${locale}`;

  return (
    <div style={{ background: theme.bg, padding: "40px", textAlign: "center" }}>
      <h2 style={{ color: theme.fg, fontSize: "28px" }}>{headline}</h2>
      <div className="phone-mockup">
        <img src={`${base}/${screenshotSrc}`} alt={headline} />
      </div>
    </div>
  );
}

export default function ScreenshotPage() {
  const [themeId, setThemeId] = useState("clean-light");
  const [locale, setLocale] = useState("en");

  return (
    <div>
      {LOCALES.map(l => (
        <button key={l} onClick={() => setLocale(l)}>{l.toUpperCase()}</button>
      ))}
      <ScreenshotSlide
        headline="BUILD BETTER HABITS"
        screenshotSrc="home.png"
        themeId={themeId}
        locale={locale}
      />
    </div>
  );
}
```
