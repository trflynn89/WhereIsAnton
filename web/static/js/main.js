var s_map = null;
var s_path = null;
var s_markers = [];
var s_showAll = false;
var s_drunkTimeout = 10;

var MILLIS_PER_HOUR = 1000 * 60 * 60;

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

    getLocations(false);
});

function getLocations(showAll)
{
    s_showAll = showAll;
    getAPI('/locations/', showLocations);
}

function getDrunks()
{
    getAPI('/drunk/', showDrunks);
}

function createDrunk(time, isDrunk)
{
    postAPI('/drunk/',
    {
        time: time,
        drunk: isDrunk
    });
}

function timeComparator(a, b)
{
    if (a['time'] < b['time'])
    {
        return 1;
    }
    else if (a['time'] > b['time'])
    {
        return -1;
    }

    return 0;
}

function showLocations(locations)
{
    if (locations.length == 0)
    {
        return;
    }

    locations.sort(timeComparator);
    clearMarkers();
    clearPath();

    if (s_showAll)
    {
        var bounds = new google.maps.LatLngBounds();
        var coords = [];

        for (var i = 0; i < locations.length; ++i)
        {
            var lat = locations[i]['latitude'];
            var lng = locations[i]['longitude'];
            var adr = locations[i]['address'];

            var latlng = addMarker(lat, lng, adr);
            bounds.extend(latlng);
            coords.push(latlng);
        }

        s_map.fitBounds(bounds);
        addPath(coords);
    }
    else
    {
        var lat = locations[0]['latitude'];
        var lng = locations[0]['longitude'];
        var adr = locations[0]['address'];

        s_map.setCenter(new google.maps.LatLng(lat, lng));
        s_map.setZoom(8);

        addMarker(lat, lng, adr);
    }
}

function showDrunks(drunks)
{
    var name = getName();

    if (drunks.length == 0)
    {
        Lobibox.alert('error',
        {
            title: 'Nope!',
            msg: name + ' has never been drunk :('
        });

        return;
    }

    drunks.sort(timeComparator);

    var isDrunk = drunks[0]['drunk'];
    var dTime = new Date(drunks[0]['time']).getTime();
    var cTime = new Date().getTime();

    var hours = Math.ceil((cTime - dTime) / MILLIS_PER_HOUR);

    if (isDrunk && (hours > s_drunkTimeout))
    {
        sTime = dTime + (s_drunkTimeout * MILLIS_PER_HOUR);
        createDrunk(sTime, false);

        hours = Math.ceil((cTime - sTime) / MILLIS_PER_HOUR);
        isDrunk = false;
    }

    var answer = (isDrunk ? 'Yes!' : 'Nope!');
    var status = (isDrunk ? ' drunk ' : ' sober ');
    var units = (hours == 1 ? ' hour' : ' hours');
    var smile = (isDrunk ? ' :)' : ' :(');
    var type = (isDrunk ? 'info' : 'error');

    var msg = name + ' has been' + status + 'for ' + hours + units + smile;

    Lobibox.alert(type,
    {
        title: answer,
        msg: msg
    });
}

function addMarker(lat, lng, label)
{
    var latlng = new google.maps.LatLng(lat, lng);

    for (var i = 0; i < s_markers.length; ++i)
    {
        var pos = s_markers[i].position;

        if ((pos.lat() === lat) && (pos.lng() === lng))
        {
            return latlng;
        }
    }

    var marker = new google.maps.Marker(
    {
        position: latlng,
        map: s_map
    });

    labelMarker(marker, label);
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

function addPath(coords)
{
    var path = [];

    for (var i = 0; i < coords.length; ++i)
    {
        path.push(coords[i]);

        if (i + 1 < coords.length)
        {
            var bounds = new google.maps.LatLngBounds();
            bounds.extend(coords[i]);
            bounds.extend(coords[i + 1]);

            var center = bounds.getCenter();

            var offcenter = new google.maps.LatLng(
                center.lat() + rand(0, 4),
                center.lng() + rand(0, 4)
            );

            path.push(offcenter);
        }
    }

    s_path = new google.maps.Polyline({
        path: path,
        strokeColor: '#ff0000',
        stokeOpacity: 0.85,
        strokeWeight: 2,
        geodesic: true
    });

    s_path.setMap(s_map);
}

function clearPath()
{
    if (s_path !== null)
    {
        s_path.setMap(null);
        s_path = null;
    }
}

function getAPI(uri, onResponse)
{
    setLoadStatus(true);

    $.get(uri, function(data)
    {
        if (typeof onResponse !== 'undefined')
        {
            onResponse(data.data);
        }

        setLoadStatus(false);
    });
}

function postAPI(uri, data, onResponse)
{
    $.post(uri, data, function(data)
    {
        if (typeof onResponse !== 'undefined')
        {
            onResponse(data);
        }
    });
}

function setLoadStatus(loading)
{
    if (loading)
    {
        $('.hamburger').children().addClass('loading');
    }
    else
    {
        $('.hamburger').children().removeClass('loading');
    }
}

function rand(min, max)
{
    var sign = (Math.random() < 0.5 ? -1 : 1);
    return sign * (Math.random() * (max - min) + min);
}
