var s_map = null;
var s_path = null;
var s_markers = [];

var s_curves = [];
var s_curvatures = [];
var s_pointPairs = [];

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
    clearMap();

    if (s_showAll)
    {
        var bounds = new google.maps.LatLngBounds();

        for (var i = 0; i < locations.length; ++i)
        {
            var lat = locations[i]['latitude'];
            var lng = locations[i]['longitude'];
            var adr = locations[i]['address'];

            var latlng = addMarker(lat, lng, adr);
            bounds.extend(latlng);
        }

        s_map.fitBounds(bounds);
        addPath();
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
            label = null;
            break;
        }
    }

    var marker = new google.maps.Marker(
    {
        position: latlng,
        optimized: false,
        zIndex: 1,
        map: s_map
    });

    if ((label !== undefined) && (label !== null))
    {
        labelMarker(marker, label);
    }

    s_markers.push(marker);
    return latlng;
}

function clearMap()
{
    for (var i = 0; i < s_curves.length; ++i)
    {
        s_curves[i].setMap(null);
    }
    for (var i = 0; i < s_markers.length; ++i)
    {
        s_markers[i].setMap(null);
    }

    s_curves = [];
    s_markers = [];
    s_curvatures = [];
    s_pointPairs = [];
}

function labelMarker(marker, message)
{
    var infowindow = new google.maps.InfoWindow(
    {
        content: message
    });

    infowindow.open(marker.getMap(), marker);

    marker.addListener('click', function()
    {
        infowindow.open(marker.getMap(), marker);
    });
}

function addPath()
{
    for (var i = 0; i < s_markers.length - 1; ++i)
    {
        s_curves.push(new google.maps.Marker(
        {
            clickable: false,
            optimized: false,
            zIndex: 0,
            map: s_map
        }));

        s_curvatures.push(rand(-0.5, 0.5));

        s_pointPairs.push([]);
        s_pointPairs[i].push(s_markers[i].getPosition());
        s_pointPairs[i].push(s_markers[i + 1].getPosition());
    }

    google.maps.event.clearListeners(s_map, 'zoom_changed');
    google.maps.event.addListener(s_map, 'zoom_changed', updateCurves);

    updateCurves();
}

function drawCurve(index)
{
    var pos1 = s_pointPairs[index][0];
    var pos2 = s_pointPairs[index][1];

    var projection = s_map.getProjection();
    var p1 = projection.fromLatLngToPoint(pos1);
    var p2 = projection.fromLatLngToPoint(pos2);

    // Quadratic Bezier curve
    var e = new google.maps.Point(p2.x - p1.x, p2.y - p1.y);
    var m = new google.maps.Point(e.x / 2, e.y / 2);
    var o = new google.maps.Point(e.y, -e.x);
    var c = new google.maps.Point(
        m.x + s_curvatures[index] * o.x,
        m.y + s_curvatures[index] * o.y
    );

    var path = 'M 0,0 q ' + c.x + ',' + c.y + ' ' + e.x + ',' + e.y;

    var zoom = s_map.getZoom();
    var scale = 1 / (Math.pow(2, -zoom));

    var symbol = {
        path: path,
        scale: scale,
        strokeWeight: 2,
        strokeColor: '#993333'
    };

    s_curves[index].setOptions(
    {
        position: pos1,
        icon: symbol
    });
}

function updateCurves()
{
    for (var i = 0; i < s_curves.length; ++i)
    {
        drawCurve(i);
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
    return (Math.random() * (max - min) + min);
}
