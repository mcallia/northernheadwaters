/* Northern Headwaters maps (Leaflet, vendored).
   #plan-map  — protected areas (real boundaries, BC Data Catalogue) + the three
                current proposals (approximate markers sized by hectares).
   #mines-map — mines & major projects by stage, over a faint protection layer.
   Register note: these are reference maps, not legal documents. Proposal
   markers are approximate; boundaries live on the official engagement pages. */
(function () {
  if (typeof L === "undefined") return;

  var TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
  var TILES_ATTR = "Tiles © Esri — Esri, USGS, NOAA | Boundaries: BC Data Catalogue (Tantalis), retrieved Jul 2026";

  function fmtHa(ha) {
    return ha ? Number(ha).toLocaleString("en-CA") + " ha" : "";
  }

  function base(el, center, zoom) {
    var map = L.map(el, { scrollWheelZoom: false });
    map.setView(center, zoom);
    L.tileLayer(TILES, { attribution: TILES_ATTR, maxZoom: 13 }).addTo(map);
    return map;
  }

  function addProtected(map, style, interactive) {
    return fetch("data/protected-areas.geojson")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (gj) {
        var layer = L.geoJSON(gj, {
          interactive: !!interactive,
          style: function (f) {
            var cons = f.properties.cls === "conservancy";
            return {
              color: cons ? "#1e6e67" : "#2e7a4d",
              weight: style.weight, fillColor: cons ? "#2a877e" : "#2e7a4d",
              fillOpacity: style.fillOpacity
            };
          },
          onEachFeature: interactive ? function (f, l) {
            var p = f.properties;
            l.bindPopup("<strong>" + p.name + "</strong><br>" +
              (p.cls === "conservancy" ? "Conservancy" : (p.des || "Protected area")) +
              (p.ha ? " · " + fmtHa(p.ha) : ""));
          } : undefined
        });
        layer.addTo(map);
        return layer;
      })
      .catch(function () {
        var n = document.getElementById("map-note");
        if (n) n.textContent = "Protected-area boundaries failed to load — reload the page, or see the official maps linked below.";
      });
  }

  /* ---------- The Plan map ---------- */
  var planEl = document.getElementById("plan-map");
  if (planEl) {
    var map = base(planEl, [57.6, -129.3], 5);
    addProtected(map, { weight: 1, fillOpacity: 0.42 }, true);

    fetch("data/proposals.json")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        d.areas.forEach(function (a) {
          var radius = Math.sqrt((a.ha * 10000) / Math.PI); // metres, area-true circle
          L.circle([a.lat, a.lon], {
            radius: radius, color: "#c07d1d", weight: 3, dashArray: "10 8",
            fillColor: "#c07d1d", fillOpacity: 0.13
          }).addTo(map).bindPopup(
            '<strong>' + a.name + "</strong><br>" + a.mechanism + "<br>" +
            '<span style="color:#9c6210;font-weight:700">' + a.status + "</span><br>" +
            '<a href="' + a.gov_url + '" rel="noopener">Comment in the official process ↗</a> · ' +
            '<a href="' + a.tour_url + '" rel="noopener">Guided tour ↗</a>' +
            "<br><em>Marker approximate — official boundary maps at the links.</em>");
          L.marker([a.lat, a.lon], {
            icon: L.divIcon({
              className: "plan-label",
              html: '<span>' + a.name + "</span>",
              iconSize: null
            })
          }).addTo(map);
        });
      })
      .catch(function () {});
  }

  /* ---------- The Case mines map ---------- */
  var minesEl = document.getElementById("mines-map");
  if (minesEl) {
    var mmap = base(minesEl, [57.4, -130.2], 5);
    addProtected(mmap, { weight: 0.6, fillOpacity: 0.16 }, false);

    var STAGE = {
      operating:   { c: "#b3402e", label: "Operating" },
      approved:    { c: "#e0782e", label: "Approved" },
      development: { c: "#c07d1d", label: "In development" },
      advanced:    { c: "#8a6d9c", label: "Advanced project" },
      exploration: { c: "#5c7a92", label: "Exploration" },
      legacy:      { c: "#5b5b5b", label: "Legacy / cleanup" }
    };

    fetch("data/mines.json")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        d.mines.forEach(function (m) {
          var s = STAGE[m.stage] || STAGE.exploration;
          L.circleMarker([m.lat, m.lon], {
            radius: 9, color: "#fff", weight: 2, fillColor: s.c, fillOpacity: 0.95
          }).addTo(mmap).bindPopup(
            "<strong>" + m.name + "</strong> · " + m.commodity + "<br>" +
            m.owner + "<br>" +
            '<span style="color:' + s.c + ';font-weight:700">' + m.stage_label + "</span><br>" +
            m.detail + "<br>" +
            "<em>Watershed: " + m.watershed + "</em><br>" +
            '<a href="' + m.source + '" rel="noopener">Source ↗</a>');
        });
        var chips = document.getElementById("mine-chips");
        if (chips) {
          Object.keys(STAGE).forEach(function (k) {
            var el = document.createElement("span");
            el.className = "chip";
            el.innerHTML = '<span class="swatch" style="background:' + STAGE[k].c + '"></span>' + STAGE[k].label;
            chips.appendChild(el);
          });
        }
      })
      .catch(function () {
        var n = document.getElementById("mines-note");
        if (n) n.textContent = "The project ledger failed to load — reload the page.";
      });
  }
})();
