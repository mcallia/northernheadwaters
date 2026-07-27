/* Highway cams: DriveBC still images, cache-busted every load and refreshed
   every 5 minutes. IDs verified live July 26, 2026 (Meziadin Junction cam 256
   existed but was offline/stale — swap it in here if it comes back). */
(function () {
  function refresh() {
    document.querySelectorAll("img[data-cam]").forEach(function (img) {
      img.src = "https://www.drivebc.ca/images/" + img.getAttribute("data-cam") + ".jpg?t=" + Date.now();
    });
  }
  refresh();
  setInterval(refresh, 5 * 60 * 1000);
})();
