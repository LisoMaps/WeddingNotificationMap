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

// store markers for editing
var markerLookup = {};

// ---- helper functions ----

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

function setNotified(id, value) {
  var layer = markerLookup[id];
  layer.feature.properties.Notified = value;
  updateMarker(layer);
  layer.closePopup();
}

// 3. Load GeoJSON points
var notify_addresses = L.geoJson.ajax("data/HousesToNotify.geojson", {
  onEachFeature: function (feature, layer) {
    markerLookup[L.stamp(layer)] = layer;

    updatePopup(layer);
  },

  pointToLayer: function (feature, latlng) {
    var marker = L.marker(latlng, {
      title: "Click for notification status",
      riseOnHover: true,
    });

    // attach feature manually so our helper functions can access it
    marker.feature = feature;

    // set icon after creation
    setTimeout(function () {
      updateMarker(marker);
    }, 0);

    return marker;
  },
});

// Add markers to map
notify_addresses.addTo(mymap);
