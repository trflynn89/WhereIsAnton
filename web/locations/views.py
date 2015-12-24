import json

from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.views.generic import View

from models import Location

class Locations(View):

    def get(self, request, *args, **kwargs):
        locations = list()

        try:
            for loc in Location.GetAllLocations():
                location = dict()

                location['time'] = loc.time.isoformat()
                location['address'] = loc.address
                location['latitude'] = loc.latitude
                location['longitude'] = loc.longitude

                locations.append(location)
        except:
            pass

        return HttpResponse(
            json.dumps({ 'locations': locations }),
            content_type='application/json')

    def post(self, request, *args, **kwargs):
        address = request.POST.get('address')
        latitude = request.POST.get('latitude')
        longitude = request.POST.get('longitude')

        if not address or not latitude or not longitude:
            return HttpResponseBadRequest()

        # Delete duplicate addresses
        for location in Location.GetAllLocations():
            if address == location.address:
                location.delete()

        Location(
            address=address,
            latitude=float(latitude),
            longitude=float(longitude)
        ).put()

        return HttpResponse()
