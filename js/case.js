/* The Case scrolly: a sticky "system map" of the five headwaters that
   composes as the chapters scroll. Each .step carries data-ch; each chapter
   turns SVG groups on/off. Degrades to the full final state without JS
   (all groups default visible via .no-js fallback in the page). */
(function () {
  var svg = document.getElementById("system-svg");
  var steps = document.querySelectorAll(".scrolly-steps .step");
  if (!svg || !steps.length) return;

  var status = document.getElementById("sh-status");
  // chapter -> [group ids visible], status line
  var STATES = {
    1: { on: ["rivers", "salmon-a"], label: "FIVE RIVERS · ONE SOURCE" },
    2: { on: ["rivers", "salmon-a", "mines", "rush"], label: "THE RUSH IS ON" },
    3: { on: ["rivers", "salmon-b", "mines", "rush", "risk"], label: "WHAT'S ON THE TABLE" },
    4: { on: ["rivers", "salmon-b", "mines", "consent"], label: "NATIONS AT THE TABLE" },
    5: { on: ["rivers", "salmon-a", "mines", "consent", "protect"], label: "ZONED, NOT TRADED" },
    6: { on: ["rivers", "salmon-a", "mines", "consent", "protect", "tagline"], label: "PROTECT THE SOURCE" }
  };
  var ALL = ["rivers", "salmon-a", "salmon-b", "mines", "rush", "risk", "consent", "protect", "tagline"];

  function setChapter(ch) {
    var st = STATES[ch] || STATES[1];
    ALL.forEach(function (id) {
      var g = document.getElementById(id);
      if (g) g.classList.toggle("off", st.on.indexOf(id) === -1);
    });
    if (status) status.textContent = st.label;
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) setChapter(+e.target.getAttribute("data-ch"));
    });
  }, { rootMargin: "-40% 0px -40% 0px" });
  steps.forEach(function (s) { obs.observe(s); });
  setChapter(1);
})();
