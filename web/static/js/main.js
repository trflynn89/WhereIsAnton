var s_map = null;
var s_markers = [];
var s_paths = [];

var s_drunkTimeout = 10;

var MILLIS_PER_HOUR = 1000 * 60 * 60;
var METERS_PER_MILE = 1609.34;

var GMap = google.maps.Map;
var GPoint = google.maps.Point;
var GMarker = google.maps.Marker;
var GLatLng = google.maps.LatLng;
var GLatLngBounds = google.maps.LatLngBounds;
var GStyledMapType = google.maps.StyledMapType;
var GInfoWindow = google.maps.InfoWindow;
var GDistance = google.maps.geometry.spherical.computeDistanceBetween;
var GEvent = google.maps.event;

var s_style =
[
    {
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        stylers: [
            {
                color: '#444444'
            }
        ]
    },
    {
        featureType: 'landscape',
        elementType: 'all',
        stylers: [
            {
                color: '#f2f2f2'
            }
        ]
    },
    {
        featureType: 'poi',
        elementType: 'all',
        stylers: [
            {
                visibility: 'off'
            }
        ]
    },
    {
        featureType: 'road',
        elementType: 'all',
        stylers: [
            {
                'saturation': -100
            },
            {
                'lightness': 45
            }
        ]
    },
    {
        featureType: 'road.highway',
        elementType: 'all',
        stylers: [
            {
                visibility: 'simplified'
            }
        ]
    },
    {
        featureType: 'road',
        elementType: 'labels',
        stylers: [
            {
                visibility: 'off'
            }
        ]
    },
    {
        featureType: 'road.arterial',
        elementType: 'labels.icon',
        stylers: [
            {
                visibility: 'off'
            }
        ]
    },
    {
        featureType: 'transit',
        elementType: 'all',
        stylers: [
            {
                visibility: 'off'
            }
        ]
    },
    {
        featureType: 'water',
        elementType: 'all',
        stylers: [
            {
                color: '#46bcec'
            },
            {
                visibility: 'on'
            }
        ]
    }
];

$(document).ready(function(event)
{
    s_map = new GMap(document.getElementById('map'),
    {
        center: new GLatLng(0, 0),
        disableDefaultUI: true,
        maxZoom: 10,
        zoom: 2
    });

    s_map.mapTypes.set('s_style', new GStyledMapType(s_style));
    s_map.setMapTypeId('s_style');

    GEvent.addListener(s_map, 'zoom_changed', updatePaths);

    var data = dataToShow();

    if (data == "drunk")
    {
        getLocations(false);
        getDrunks();
    }
    else if (data == "history")
    {
        getLocations(true);
    }
    else
    {
        getLocations(false);
    }
});

function getLocations(showAll)
{
    getAPI('/locations/',
    {
        limit: showAll ? null : 1
    }, showLocations);
}

function getDrunks()
{
    getAPI('/drunk/',
    {
        limit: 1
    }, showDrunks);
}

function createDrunk(time, isDrunk)
{
    postAPI('/drunk/',
    {
        time: time,
        drunk: isDrunk
    }, null);
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
    locations.sort(timeComparator);
    clearMap();

    var bounds = new GLatLngBounds();

    for (var i = 0; i < locations.length; ++i)
    {
        var lat = locations[i]['latitude'];
        var lng = locations[i]['longitude'];
        var adr = locations[i]['address'];

        var latlng = addMarker(lat, lng, adr);
        bounds.extend(latlng);
    }

    fitBounds(bounds);
    drawPaths();
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

function clearMap()
{
    for (var i = 0; i < s_markers.length; ++i)
    {
        s_markers[i].setMap(null);
    }
    for (var i = 0; i < s_paths.length; ++i)
    {
        var marker = s_paths[i].marker;
        marker.setMap(null);
    }

    s_markers = [];
    s_paths = [];
}

function addMarker(lat, lng, label)
{
    var latlng = new GLatLng(lat, lng);

    var marker = new GMarker(
    {
        position: latlng,
        optimized: false,
        zIndex: 1,
        map: s_map
    });

    for (var i = 0; i < s_markers.length; ++i)
    {
        if (s_markers[i].position.equals(latlng))
        {
            marker.setMap(null);
            break;
        }
    }

    labelMarker(marker, label);
    s_markers.push(marker);

    return latlng;
}

function labelMarker(marker, message)
{
    var map = marker.getMap();

    if ((map !== null) && (message !== undefined))
    {
        var infowindow = new GInfoWindow(
        {
            content: message
        });

        infowindow.open(marker.getMap(), marker);

        marker.addListener('click', function()
        {
            infowindow.open(marker.getMap(), marker);
        });
    }
}

function fitBounds(bounds)
{
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();

    var north = Math.max(sw.lat(), ne.lat());
    var south = Math.min(sw.lat(), ne.lat());
    var east = Math.max(sw.lng(), ne.lng());
    var west = Math.min(sw.lng(), ne.lng());

    s_map.fitBounds(new GLatLngBounds(
        new GLatLng(south, west),
        new GLatLng(north, east)
    ));
}

function drawPaths()
{
    for (var i = 1; i < s_markers.length; ++i)
    {
        var start = s_markers[i - 1].getPosition();
        var end = s_markers[i].getPosition();

        var curvature = calcCurvature(start, end);

        s_paths.push(
        {
            start: start,
            end: end,
            curvature: curvature,
            marker: new GMarker(
            {
                clickable: false,
                optimized: false,
                zIndex: 0,
                map: s_map
            })
        });
    }

    updatePaths();
}

function updatePaths()
{
    var scale = 1 / (Math.pow(2, -1 * s_map.getZoom()));

    for (var i = 0; i < s_paths.length; ++i)
    {
        var path = s_paths[i];

        path.marker.setOptions(
        {
            position: path.start,
            icon:
            {
                path: calcPath(path),
                scale: scale,
                strokeColor: '#993333',
                strokeWeight: 2
            }
        });
    }
}

function calcPath(path)
{
    var projection = s_map.getProjection();

    if (projection === undefined)
    {
        return '';
    }

    var p1 = projection.fromLatLngToPoint(path.start);
    var p2 = projection.fromLatLngToPoint(path.end);

    // Quadratic Bezier curve
    var e = new GPoint(p2.x - p1.x, p2.y - p1.y);
    var m = new GPoint(e.x / 2, e.y / 2);
    var o = new GPoint(e.y, -e.x);
    var c = new GPoint(m.x + path.curvature * o.x, m.y + path.curvature * o.y);

    return ('M 0,0 q' + ' ' + c.x + ',' + c.y + ' ' + e.x + ',' + e.y);
}

function calcCurvature(start, end)
{
    var curvature = 0.05;

    for (var j = 0; j < s_paths.length; ++j)
    {
        var path = s_paths[j];

        if (arePathsSimilar(path.start, path.end, start, end))
        {
            curvature += 0.05;
        }
    }

    return curvature;
}

function arePathsSimilar(p1Start, p1End, p2Start, p2End)
{
    var d1 = GDistance(p1Start, p2Start) / METERS_PER_MILE;
    var d2 = GDistance(p1End, p2End) / METERS_PER_MILE;

    var d3 = GDistance(p1Start, p2End) / METERS_PER_MILE;
    var d4 = GDistance(p1End, p2Start) / METERS_PER_MILE;

    return (((d1 < 100) && (d2 < 100)) || ((d3 < 100) && (d4 < 100)));
}

function getAPI(uri, data, onResponse)
{
    setLoadStatus(true);

    $.get(uri, data, function(data)
    {
        if (onResponse !== null)
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
        if (onResponse !== null)
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
