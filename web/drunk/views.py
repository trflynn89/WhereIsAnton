import datetime
import json

from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.views.generic import View

from models import Drunks

class Drunk(View):

    def get(self, request, *args, **kwargs):
        drunks = list()

        try:
            for d in Drunks.GetAllDrunks():
                drunk = dict()

                drunk['time'] = d.time.isoformat()
                drunk['drunk'] = d.drunk

                drunks.append(drunk)
        except:
            pass

        return HttpResponse(
            json.dumps({ 'drunks': drunks }),
            content_type='application/json')

    def post(self, request, *args, **kwargs):
        time = request.POST.get('time')
        isDrunk = request.POST.get('drunk')

        if not isDrunk:
            return HttpResponseBadRequest()

        isDrunk = (isDrunk == 1) or (isDrunk == '1')
        drunk = Drunks.GetLastDrunk()

        if drunk:
            if drunk.drunk and isDrunk:
                return HttpResponseBadRequest()
            if not drunk.drunk and not isDrunk:
                return HttpResponseBadRequest()

        if time:
            time = float(time) / 1000.0
            time = datetime.datetime.fromtimestamp(time)

            Drunks(
                time=time,
                drunk = isDrunk
            ).put()
        else:
            Drunks(
                drunk=isDrunk
            ).put()

        return HttpResponse()
