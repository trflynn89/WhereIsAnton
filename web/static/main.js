var s_map;
var s_path;
var s_markers = [];
var s_showAll = false;

$(document).ready(function(event)
{
    s_map = new google.maps.Map(
        document.getElementById('map'),
        {
            disableDefaultUI: true,
            center: { lat: 0, lng: 0 },
            zoom: 2
        }
    );

    getLocations();
});

function getLocations()
{
    $.get('/locations', function(data)
    {
        addLocations(data.locations);
    });
}

function addLocations(locations)
{
    if (locations.length == 0)
    {
        return;
    }

    locations.sort(function(a, b)
    {
        if (a['time'] == b['time'])
            return 0;
        if (a['time'] < b['time'])
            return 1;
        if (a['time'] > b['time'])
            return -1;
    });

    clearMarkers();

    if ((s_path !== undefined) && (s_path != null))
    {
        s_path.setMap(null);
        s_path = null;
    }

    if (s_showAll)
    {
        var bounds = new google.maps.LatLngBounds();
        var coords = [];

        for (var i = 0; i < locations.length; ++i)
        {
            var latlng = addMarker(locations[i]);
            bounds.extend(latlng);
            coords.push(latlng);
        }

        s_map.fitBounds(bounds);

        s_path = new google.maps.Polyline({
            path: coords,
            geodesic: true,
            strokeColor: '#ff0000',
            stokeOpacity: 0.85,
            strokeWeight: 2
        });

        s_path.setMap(s_map);
    }
    else
    {
        var lat = locations[0]['latitude'];
        var lng = locations[0]['longitude'];

        s_map.setCenter(new google.maps.LatLng(lat, lng));
        s_map.setZoom(5);

        addMarker(locations[0]);
    }
}

function addMarker(location)
{
    var latlng = new google.maps.LatLng(location['latitude'], location['longitude']);

    var marker = new google.maps.Marker(
    {
        position: latlng,
        map: s_map
    });

    labelMarker(marker, location['address']);
    s_markers.push(marker);

    return latlng;
}

function clearMarkers()
{
    for (var i = 0; i < s_markers.length; ++i)
    {
        s_markers[i].setMap(null);
    }

    s_markers = [];
}

function labelMarker(marker, message)
{
    var infowindow = new google.maps.InfoWindow({ content: message });
    infowindow.open(marker.getMap(), marker);

    marker.addListener('click', function()
    {
        infowindow.open(marker.getMap(), marker);
    });
}

function handleNavOption(showAll)
{
    s_showAll = showAll;
    getLocations();
}
