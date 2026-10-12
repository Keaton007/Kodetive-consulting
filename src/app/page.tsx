import Script from "next/script";
import { SITE_MARKUP } from "./site-markup";

// The page is static HTML plus one plain script (public/js/site.js) that runs the
// WebGL scenes, the scroll stage, the app ring and the detail panel.
export default function Home() {
  return (
    <>
      <div id="site" style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: SITE_MARKUP }} />
      <Script src="/js/site.js" strategy="afterInteractive" />
    </>
  );
}
