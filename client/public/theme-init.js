// Sets the light/dark theme BEFORE the page draws, so it never flashes the wrong one.
// Kept as a separate file (not inline in index.html) so the Content-Security-Policy
// can forbid inline scripts entirely (see public/_headers).
(function () {
  try {
    var saved = JSON.parse(localStorage.getItem('studyslot-theme') || '"auto"');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = saved === 'dark' || (saved !== 'light' && prefersDark);
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
  } catch (error) {
    // If anything goes wrong, Bootstrap's default (light) is used.
  }
})();
