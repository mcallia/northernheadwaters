/* Newsroom renderer: data/news.json → cards.
   Used two ways: #news-teaser (homepage, first N items) and #news-list
   (newsroom, with filter pills). Fails soft to a note + the live FB page. */
(function () {
  var CAT = {
    campaign: "Northern Headwaters",
    coalition: "Allies & Nations",
    media: "In the news"
  };
  function fmtDate(s) {
    var d = new Date(s + (s.length === 10 ? "T12:00:00" : ""));
    return isNaN(d) ? "" : d.toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
  }
  function row(it) {
    var el = document.createElement("li");
    el.className = "news-row";
    el.innerHTML = '<span class="news-date">' + fmtDate(it.date) + "</span>" +
      '<span class="news-src tag-' + (it.cat || "media") + '">' + (it.source || CAT[it.cat] || "News") + "</span>" +
      '<a href="' + it.url + '" rel="noopener">' + it.title + "</a>";
    return el;
  }
  function card(it) {
    var el = document.createElement("div");
    el.className = "card";
    el.innerHTML = '<a class="card-link" href="' + it.url + '" rel="noopener"><div class="card-body">' +
      '<span class="card-tag tag-' + (it.cat || "media") + '">' + (CAT[it.cat] || "News") + "</span>" +
      "<h3>" + it.title + "</h3>" +
      "<p>" + (it.source || "") + (it.date ? " · " + fmtDate(it.date) : "") + "</p>" +
      "</div></a>";
    return el;
  }
  function fail(el) {
    el.innerHTML = '<p class="feed-note">The feed is resting. Latest posts are on ' +
      '<a href="https://www.facebook.com/NorthernHeadwatersBC" rel="noopener">the Northern Headwaters Facebook page</a>.</p>';
  }

  fetch("data/news.json")
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) {
      var items = d.items || [];
      var upd = document.getElementById("news-updated");
      if (upd && d.updated) upd.textContent = "Feed refreshed " + fmtDate(d.updated.slice(0, 10)) + ".";

      var teaser = document.getElementById("news-teaser");
      if (teaser) {
        var n = +(teaser.getAttribute("data-count") || 3);
        teaser.innerHTML = "";
        items.slice(0, n).forEach(function (it) { teaser.appendChild(card(it)); });
        if (!items.length) fail(teaser);
      }

      var list = document.getElementById("news-list");
      if (list) {
        var current = "all";
        function render() {
          list.innerHTML = "";
          var shown = items.filter(function (it) { return current === "all" || it.cat === current; });
          shown.forEach(function (it) { list.appendChild(row(it)); });
          if (!shown.length) list.innerHTML = '<li class="feed-note">Nothing in this bucket yet.</li>';
        }
        document.querySelectorAll(".news-pills button").forEach(function (b) {
          b.addEventListener("click", function () {
            current = b.getAttribute("data-filter");
            document.querySelectorAll(".news-pills button").forEach(function (x) {
              x.setAttribute("aria-pressed", x === b ? "true" : "false");
            });
            render();
          });
        });
        render();
      }
    })
    .catch(function () {
      ["news-teaser", "news-list"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) fail(el);
      });
    });
})();
