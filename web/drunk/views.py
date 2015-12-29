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
            limit = request.GET.get('limit');
            limit = int(limit) if limit else None

            for d in Drunks.GetAllDrunks(limit):
                drunk = dict()

                drunk['time'] = d.time.isoformat()
                drunk['drunk'] = d.drunk

                drunks.append(drunk)
        except:
            pass

        return HttpResponse(
            json.dumps({ 'data': drunks }),
            content_type='application/json')

    def post(self, request, *args, **kwargs):
        time = request.POST.get('time')
        drunk = request.POST.get('drunk')

        if not drunk:
            return HttpResponseBadRequest()

        isDrunk = (drunk == 1) or (drunk == '1')
        last = Drunks.GetLastDrunk()

        if last and (last.drunk == isDrunk):
            return HttpResponseBadRequest()

        if time:
            Drunks(
                time=self._convertEpoch(time),
                drunk=isDrunk
            ).put()
        else:
            Drunks(
                drunk=isDrunk
            ).put()

        return HttpResponse()

    def _convertEpoch(self, time):
        return datetime.datetime.fromtimestamp(float(time) / 1000.0)
