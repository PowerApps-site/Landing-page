/* Runs in <head> before first paint: applies the saved theme without a flash,
   and marks the document as JS-capable so scroll-reveal can start hidden.
   Without JS the `.js` class is absent and all content renders immediately. */
(function () {
  document.documentElement.classList.add('js');
  try {
    if (localStorage.getItem('pa-theme') === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
