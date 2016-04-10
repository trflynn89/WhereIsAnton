var s_map = null;
var s_markers = [];
var s_clusters = [];
var s_centroids = [];
var s_paths = [];

var MILLIS_PER_HOUR = 1000 * 60 * 60;
var METERS_PER_MILE = 1609.34;
var MIN_CLUSTERS = 4;
var MAX_ZOOM = 5;

var GMap = google.maps.Map;
var GPoint = google.maps.Point;
var GCircle = google.maps.Circle;
var GMarker = google.maps.Marker;
var GPolyline = google.maps.Polyline;
var GSymbolPath = google.maps.SymbolPath;
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
    GEvent.addListener(s_map, 'zoom_changed', updateCentroids);

    var data = dataToShow();

    if (data === "drunk")
    {
        getLocations(false);
        getDrunks();
    }
    else if (data === "history")
    {
        getLocations(true);
    }
    else if (data == "cluster")
    {
        getClusters();
    }
    else
    {
        getLocations(false);
    }
});

function median(arr)
{
    arr.sort(function(a, b)
    {
        return a - b;
    });

    var mid = Math.floor(arr.length / 2);

    if ((arr.length % 2) == 0)
    {
        return (arr[mid - 1] + arr[mid]) / 2.0;
    }

    return arr[mid];
}

function getLocations(showAll)
{
    getAPI('/locations/',
    {
        limit: showAll ? null : 1
    }, showLocations);
}

function getClusters()
{
    getAPI('/locations/',
    {
        limit: null
    }, showClusters);
}

function getDrunks()
{
    getAPI('/drunk/',
    {
        limit: 1
    }, showDrunks);
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

    var coords = [];

    for (var i = 0; i < locations.length; ++i)
    {
        var lat = locations[i]['latitude'];
        var lng = locations[i]['longitude'];
        var adr = locations[i]['address'];

        var latlng = addMarker(lat, lng, adr);
        coords[i] = latlng;
    }

    fitCoordinates(coords);
    drawPaths();
}

function showClusters(locations)
{
    locations.sort(timeComparator);
    clearMap();

    var k = clusterSize();
    var coords = [];

    for (var i = 0; i < locations.length; ++i)
    {
        var lat = locations[i]['latitude'];
        var lng = locations[i]['longitude'];

        var latlng = new GLatLng(lat, lng);
        coords[i] = latlng;
    }

    fitCoordinates(coords);

    if (k < 1)
    {
        k = Math.floor(Math.sqrt(coords.length / 2));
        k = Math.max(k, MIN_CLUSTERS);
    }

    s_clusters = kmedian(coords, k);

    for (var i = 0; i < s_clusters.centroids.length; ++i)
    {
        s_centroids[i] = new google.maps.Circle(
        {
            center: s_clusters.centroids[i],
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.35,
            map: s_map
        });
    }

    updateCentroids();
}

function updateCentroids()
{
    var zoom = s_map.getZoom();
    var radius = 4000000;

    if (zoom > 0)
    {
        radius *= 1 / zoom;
    }

    for (var i = 0; i < s_centroids.length; ++i)
    {
        var numPoints = s_clusters.counts.reduce(function(a, b)
        {
            return a + b;
        });

        var percent = s_clusters.counts[i] / numPoints;
        percent = Math.max(percent, 0.25);

        s_centroids[i].setOptions(
        {
            radius: percent * radius
        });
    }
}

function showDrunks(drunks)
{
    var name = getName();

    if (drunks.length === 0)
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

    var answer = (isDrunk ? 'Yes!' : 'Nope!');
    var status = (isDrunk ? ' drunk ' : ' sober ');
    var units = (hours === 1 ? ' hour' : ' hours');
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

    for (var i = 0; i < s_centroids.length; ++i)
    {
        s_centroids[i].setMap(null);
    }

    for (var i = 0; i < s_paths.length; ++i)
    {
        s_paths[i].arrow.setMap(null);
        s_paths[i].curve.setMap(null);
    }

    s_markers = [];
    s_centroids = [];
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

function fitCoordinates(bounds)
{
    var north = null, south = null, east = null, west = null;

    for (var i = 0; i < bounds.length; ++i)
    {
        var lat = bounds[i].lat();
        var lng = bounds[i].lng();

        north = (north ? Math.max(north, lat) : lat);
        south = (south ? Math.min(south, lat) : lat);
        east = (east ? Math.max(east, lng) : lng);
        west = (west ? Math.min(west, lng) : lng);
    }

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

        s_paths.push(
        {
            start: start,
            end: end,
            curvature: calcCurvature(start, end),

            arrow: new GPolyline(
            {
                strokeOpacity: 0,
                map: s_map
            }),

            curve: new GMarker(
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
    var zoom = s_map.getZoom();
    var scale = 1 / (Math.pow(2, -zoom));

    for (var i = 0; i < s_paths.length; ++i)
    {
        var path = s_paths[i];
        var bezier = bezierCurve(path);

        if (bezier === null)
        {
            path.arrow.setOptions({ icons: null });
            path.curve.setOptions({ icon: null });
            continue;
        }

        // FIXME for some reason, the Bezier curves "jump" when the map zoom
        // level is > 5. For now, just hide the curve when zoomed that far.
        if (zoom > MAX_ZOOM)
        {
            path.arrow.setOptions({ icons: null });
        }
        else
        {
            path.arrow.setOptions(
            {
                path: bezierTangent(bezier),
                icons: [
                {
                    offset: '50%',
                    icon:
                    {
                        path: GSymbolPath.BACKWARD_CLOSED_ARROW,
                        strokeColor: '#993333',
                        fillColor: '#993333',
                        strokeWeight: 2,
                        strokeOpacity: 1,
                        fillOpacity: 1
                    }
                }]
            });
        }

        path.curve.setOptions(
        {
            position: path.start,
            icon:
            {
                path: bezierToSvg(bezier),
                scale: scale,
                strokeColor: '#993333',
                strokeWeight: 2
            }
        });
    }
}

function bezierCurve(path)
{
    var projection = s_map.getProjection();

    if (projection === undefined)
    {
        return null;
    }

    var p1 = projection.fromLatLngToPoint(path.start);
    var p2 = projection.fromLatLngToPoint(path.end);

    var e = new GPoint(p2.x - p1.x, p2.y - p1.y);
    var m = new GPoint(e.x / 2, e.y / 2);
    var o = new GPoint(e.y, -e.x);
    var c = new GPoint(m.x + path.curvature * o.x, m.y + path.curvature * o.y);

    return {
        projection: projection,
        p1: p1,
        p2: p2,
        c: c,
        e: e
    };
}

function bezierTangent(bezier)
{
    var m1x = bezier.c.x / 2;
    var m1y = bezier.c.y / 2;

    var m2x = (bezier.c.x + bezier.e.x) / 2;
    var m2y = (bezier.c.y + bezier.e.y) / 2;

    var m1 = new GPoint(bezier.p1.x + m1x, bezier.p1.y + m1y);
    var m2 = new GPoint(bezier.p1.x + m2x, bezier.p1.y + m2y);

    var p1 = bezier.projection.fromPointToLatLng(m1);
    var p2 = bezier.projection.fromPointToLatLng(m2);

    return [p1, p2];
}

function bezierToSvg(bezier)
{
    return ('M 0,0 q '
        + bezier.c.x + ',' + bezier.c.y + ' '
        + bezier.e.x + ',' + bezier.e.y
    );
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

function kmedian(coords, k)
{
    var centroids = computeCentroids(coords, k);
    var attached = new Array(coords.length);
    var counts = new Array(k);
    var converged = false;

    for (var i = 0; i < coords.length; ++i)
    {
        attached[i] = -1;
    }
    for (var i = 0; i < k; ++i)
    {
        counts[i] = 0;
    }

    while (!converged)
    {
        var data = new Array(k);
        converged = true;

        for (var i = 0; i < k; ++i)
        {
            data[i] = { count: 0, lats: [], lngs: [] };
        }

        for (var i = 0; i < coords.length; ++i)
        {
            var centroid = 0;

            // Select the centroid closest to this point
            var minDistance = GDistance(centroids[0], coords[i]);

            for (var j = 1; j < k; ++j)
            {
                var distance = GDistance(centroids[j], coords[i]);

                if (distance < minDistance)
                {
                    minDistance = distance;
                    centroid = j;
                }
            }

            // Check if centroids coverged and assign centroid to this point
            converged &= (attached[i] === centroid);
            attached[i] = centroid;

            // Add coordinates to centroid's meta data
            data[centroid].lats.push(coords[i].lat());
            data[centroid].lngs.push(coords[i].lng());
            ++data[centroid].count;
        }

        // Move each centroid to the median of its contained coordinates
        for (var i = 0; i < k; ++i)
        {
            if ((counts[i] = data[i].count) > 0)
            {
                var lat = median(data[i].lats);
                var lng = median(data[i].lngs);
                centroids[i] = new GLatLng(lat, lng);
            }
        }
    }

    return {
        centroids: centroids,
        counts: counts
    };
}

function computeCentroids(coords, k)
{
    var centroids = new Array(k);

    var data = new Array(coords.length);
    var totalProbability = 0;

    // 1. Choose one center uniformly at random from among the data points
    var centroid = coords[Math.floor(Math.random() * coords.length)];
    centroids[0] = centroid;

    // 2. For each data point x, compute D(x), the distance between x and the
    //    nearest center that has already been chosen
    for (var i = 0; i < coords.length; ++i)
    {
        var distance = GDistance(centroid, coords[i]);
        totalProbability += Math.pow(distance, 2);

        data[i] = {
            probability: totalProbability,
            distance: distance
        };
    }

    // 3. Choose one new data point at random as a new center, using a weighted
    //    probability distribution where a point x is chosen with probability
    //    proportional to D(x)^2
    // 4. Repeat Steps 2 and 3 until k centers have been chosen
    for (var i = 1; i < centroids.length; ++i)
    {
        var random = Math.floor(Math.random() * totalProbability);

        for (centroid = 0; centroid < coords.length; ++centroid)
        {
            if (random < data[centroid].probability)
            {
                break;
            }
        }

        for (var j = 0, totalProbability = 0; j < coords.length; ++j)
        {
            var distance = GDistance(coords[centroid], coords[j]);

            if (distance < data[j].distance)
            {
                totalProbability += Math.pow(distance, 2);

                data[j] = {
                    probability: totalProbability,
                    distance: distance
                };
            }
        }

        centroids[i] = coords[centroid];
    }

    return centroids;
}

function getAPI(uri, data, onResponse)
{
    $.get(uri, data, function(data)
    {
        if (data.exception !== null)
        {
            console.log('Exception raised: ' + data.exception);
        }

        if (onResponse !== null)
        {
            onResponse(data.data);
        }
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
