/* Review-gate check: runs synchronously in <head> of every gated page.
   The gate page (index.html) sets sessionStorage "nhi_gate" after a correct
   password. Client-side only — this keeps casual visitors and search engines
   out of a review prototype; it is not bank-grade security. */
(function () {
  try {
    if (sessionStorage.getItem("nhi_gate") !== "ok") {
      location.replace("index.html");
    }
  } catch (e) {
    /* storage blocked — let the page load rather than loop */
  }
})();
