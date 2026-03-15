// 1. Create a map object.
var mymap = L.map("map", {
  center: [34.03719219631298, -84.39525660526846],
  zoom: 17,
  maxZoom: 18,
  minZoom: 16,
  detectRetina: true,
});

// 2. Add a base map.
var Jawg_Dark = L.tileLayer(
  "https://{s}.tile.jawg.io/jawg-dark/{z}/{x}/{y}{r}.png?access-token={accessToken}",
  {
    subdomains: "abcd",
    accessToken:
      "ihDe2jNzbuwI58KsogUop26M52pHfsT5hT0QH9hda7gwdeSNAMogAE6SD4sqASGm",
  }
);
Jawg_Dark.addTo(mymap);

// Store markers for editing
var markerLookup = {};

// Neighborhood filter control
var filterControl = L.control({ position: "topright" });
filterControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "filter-control");
  div.innerHTML =
    '<b>Neighborhood</b><br><select id="neighborhood-filter"><option value="all">All</option></select>';
  L.DomEvent.disableClickPropagation(div);
  L.DomEvent.disableScrollPropagation(div);
  return div;
};
filterControl.addTo(mymap);

// ---- Helper functions ----
function updateMarker(layer) {
  var feature = layer.feature;
  var iconClass =
    feature.properties.Notified === "Yes"
      ? "fa-check-circle"
      : "fa-times-circle";
  var iconColor = feature.properties.Notified === "Yes" ? "#93c47d" : "#e06666";
  layer.setIcon(
    L.divIcon({
      html:
        '<i class="fas ' +
        iconClass +
        '" style="color:' +
        iconColor +
        '; font-size:22px;"></i>',
      className: "",
      iconSize: [20, 20],
      popupAnchor: [0, -10],
    })
  );
  updatePopup(layer);
}

function updatePopup(layer) {
  var feature = layer.feature;
  var notifiedText =
    feature.properties.Notified === "Yes"
      ? '<span style="color:#93c47d;">Notified 🎉</span>'
      : '<span style="color:#e06666;">Not notified 💩</span>';
  var popupContent =
    "<b>" +
    feature.properties.REV_Address +
    "</b><br>" +
    notifiedText +
    "<br><br>" +
    '<button onclick="setNotified(' +
    L.stamp(layer) +
    ", 'Yes')\">Yes</button> " +
    '<button onclick="setNotified(' +
    L.stamp(layer) +
    ", 'No')\">No</button>";
  layer.bindPopup(popupContent);
}

window.setNotified = function (id, value) {
  var layer = markerLookup[id];
  layer.feature.properties.Notified = value;
  updateMarker(layer);
  layer.closePopup();
};

// 3. Load GeoJSON points
var notify_addresses = L.geoJson.ajax("data/HousesToNotify.geojson", {
  interactive: true,
  bubblingMouseEvents: false,
  onEachFeature: function (feature, layer) {
    markerLookup[L.stamp(layer)] = layer;
    updatePopup(layer);

    var closeTimer;

    // Open popup on hover
    layer.on("mouseover", function () {
      clearTimeout(closeTimer);
      layer.openPopup();
    });

    // Delayed close on mouseout — gives time to move cursor into popup
    layer.on("mouseout", function () {
      closeTimer = setTimeout(function () {
        layer.closePopup();
      }, 250);
    });

    // Keep popup open when mouse is inside it
    layer.on("popupopen", function () {
      var popup = layer.getPopup().getElement();
      popup.addEventListener("mouseenter", function () {
        clearTimeout(closeTimer);
      });
      popup.addEventListener("mouseleave", function () {
        closeTimer = setTimeout(function () {
          layer.closePopup();
        }, 250);
      });
    });
  },
  pointToLayer: function (feature, latlng) {
    var marker = L.marker(latlng, {
      title: "Hover for notification status",
      riseOnHover: true,
    });
    marker.feature = feature;
    setTimeout(function () {
      updateMarker(marker);
    }, 0);
    return marker;
  },
});

// Populate neighborhood filter and wire up filtering once GeoJSON loads
notify_addresses.on("data:loaded", function () {
  var neighborhoods = new Set();
  notify_addresses.eachLayer(function (layer) {
    var n = layer.feature.properties.REV_Neighborhood;
    if (n) neighborhoods.add(n);
  });

  var select = document.getElementById("neighborhood-filter");
  Array.from(neighborhoods)
    .sort()
    .forEach(function (n) {
      var opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      select.appendChild(opt);
    });

  select.addEventListener("change", function () {
    var selected = this.value;
    notify_addresses.eachLayer(function (layer) {
      var n = layer.feature.properties.REV_Neighborhood;
      if (selected === "all" || n === selected) {
        if (!mymap.hasLayer(layer)) mymap.addLayer(layer);
      } else {
        if (mymap.hasLayer(layer)) mymap.removeLayer(layer);
      }
    });
  });
});

// Add markers to map
notify_addresses.addTo(mymap);
