import json
import math

from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.views.generic import View

from models import Location

class Locations(View):

    MIN_UPDATE_DISTANCE = 5.0
    EARTH_RADIUS = 3961.0

    def get(self, request, *args, **kwargs):
        locations = list()

        try:
            limit = request.GET.get('limit');
            limit = int(limit) if limit else None

            for loc in Location.GetAllLocations(limit):
                location = dict()

                location['time'] = loc.time.isoformat()
                location['address'] = loc.address
                location['latitude'] = loc.latitude
                location['longitude'] = loc.longitude

                locations.append(location)
        except:
            pass

        return HttpResponse(
            json.dumps({ 'data': locations }),
            content_type='application/json')

    def post(self, request, *args, **kwargs):
        address = request.POST.get('address')
        latitude = request.POST.get('latitude')
        longitude = request.POST.get('longitude')

        if not address or not latitude or not longitude:
            return HttpResponseBadRequest('Need address, latitude, and longitude')

        lastLocation = Location.GetLastLocation()

        currLocation = Location(
            address=address,
            latitude=float(latitude),
            longitude=float(longitude)
        )

        distance = self._distance(lastLocation, currLocation)

        if distance < Locations.MIN_UPDATE_DISTANCE:
            return HttpResponseBadRequest('Too close to last update (%.2f mi)' % (distance))

        currLocation.put()
        return HttpResponse()

    def _distance(self, loc1, loc2):
        [lon1, lat1] = map(math.radians, [loc1.longitude, loc1.latitude])
        [lon2, lat2] = map(math.radians, [loc2.longitude, loc2.latitude])

        dLon = lon2 - lon1
        dLat = lat2 - lat1

        a = math.sin(dLat / 2.0) ** 2 \
            + math.cos(lat1) \
            * math.cos(lat2) \
            * math.sin(dLon / 2.0) ** 2

        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return Locations.EARTH_RADIUS * c;
