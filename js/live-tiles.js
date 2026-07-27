/* Live tiles: river discharge from Water Survey of Canada realtime gauges
   (ECCC api.weather.gc.ca — keyless, CORS-open) and weather from Open-Meteo.
   Every tile fails soft with a link to its source.

   Station map (all verified live July 26, 2026):
     skeena  08EF001  Skeena River at Usk            (WSC)
     nass    08DB001  Nass River above Shumal Creek  (WSC)
     stikine 08CE001  Stikine River at Telegraph Creek (WSC)
     liard   10BE001  Liard River at Lower Crossing  (WSC)
     iskut   08CG001  Iskut River below Johnson River (WSC)
     taku    15041200 Taku River near Juneau         (USGS, cfs → m³/s)   */
(function () {
  function tile(key) { return document.querySelector('[data-live="' + key + '"]'); }
  function set(key, num, unit, ts) {
    var t = tile(key); if (!t) return;
    t.classList.remove("loading");
    t.querySelector(".live-num").innerHTML = num + '<span class="unit"> ' + unit + "</span>";
    t.querySelector(".live-ts").textContent = ts;
  }
  function fail(key, srcLabel, srcUrl) {
    var t = tile(key); if (!t) return;
    t.classList.remove("loading");
    t.classList.add("is-error");
    t.querySelector(".live-num").textContent = "—";
    t.querySelector(".live-ts").innerHTML = 'Feed unavailable — <a href="' + srcUrl + '" rel="noopener">' + srcLabel + "</a>";
  }
  function fmtTime(iso) {
    var d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  }

  // River discharge (Water Survey of Canada hydrometric realtime)
  function river(key, station) {
    fetch("https://api.weather.gc.ca/collections/hydrometric-realtime/items?STATION_NUMBER=" + station + "&limit=12&sortby=-DATETIME&f=json")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        var f = (d.features || []).find(function (x) { return x.properties.DISCHARGE != null; });
        if (!f) throw 0;
        set(key, Math.round(f.properties.DISCHARGE).toLocaleString("en-CA"), "m³/s",
            "measured " + fmtTime(f.properties.DATETIME) + " · Water Survey of Canada");
      })
      .catch(function () {
        fail(key, "Water Survey of Canada", "https://wateroffice.ec.gc.ca/report/real_time_e.html?stn=" + station);
      });
  }
  river("skeena", "08EF001");
  river("nass", "08DB001");
  river("stikine", "08CE001");
  river("liard", "10BE001");
  river("iskut", "08CG001");

  // Taku River — no Canadian realtime gauge; USGS gauges it near Juneau.
  if (tile("taku")) {
    fetch("https://waterservices.usgs.gov/nwis/iv/?format=json&sites=15041200&parameterCd=00060")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        var vals = d.value.timeSeries[0].values[0].value;
        var v = vals[vals.length - 1];
        if (!v) throw 0;
        var cms = Math.round(parseFloat(v.value) * 0.0283168);
        set("taku", cms.toLocaleString("en-CA"), "m³/s",
            "measured " + fmtTime(v.dateTime) + " · USGS (nr Juneau)");
      })
      .catch(function () { fail("taku", "USGS", "https://waterdata.usgs.gov/monitoring-location/15041200/"); });
  }

  // Weather (Open-Meteo, keyless CORS-open)
  function wx(key, lat, lon, label) {
    fetch("https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
          "&current=temperature_2m,wind_speed_10m&timezone=America%2FVancouver")
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) {
        var v = d.current.temperature_2m;
        if (v == null) throw 0;
        set(key, Math.round(v), "°C", label + " " + fmtTime(d.current.time) + " · Open-Meteo");
      })
      .catch(function () { fail(key, "Environment Canada", "https://weather.gc.ca/en/location/index.html?coords=" + lat + "," + lon); });
  }
  if (tile("dease-wx")) wx("dease-wx", 58.44, -130.01, "Dease Lake,");
  if (tile("smithers-wx")) wx("smithers-wx", 54.78, -127.17, "Smithers,");

  // Countdown to the Aug 4, 2026 4pm PT comment deadline
  var cd = tile("deadline");
  if (cd) {
    var end = new Date("2026-08-04T16:00:00-07:00").getTime();
    var msLeft = end - Date.now();
    cd.classList.remove("loading");
    if (msLeft > 0) {
      var days = Math.floor(msLeft / 86400000);
      var hrs = Math.floor((msLeft % 86400000) / 3600000);
      cd.querySelector(".live-num").innerHTML = days + '<span class="unit">d</span> ' + hrs + '<span class="unit">h</span>';
      cd.querySelector(".live-ts").textContent = "until comments close · Aug 4, 4 pm PT";
    } else {
      cd.querySelector(".live-num").textContent = "Closed";
      cd.querySelector(".live-ts").textContent = "Comment period ended Aug 4, 2026";
    }
  }
})();
