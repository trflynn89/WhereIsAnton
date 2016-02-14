import datetime
import json

from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.views.generic import View

from models import Drunks

class Drunk(View):

    SECONDS_PER_HOUR = 60.0 ** 2
    DRUNK_TIMEOUT = 10.0

    def get(self, request, *args, **kwargs):
        last = self._getLastDrunk()
        drunks = list()

        try:
            limit = request.GET.get('limit');
            limit = int(limit) if limit else None

            for d in Drunks.GetAllDrunks(limit, last):
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
            return HttpResponseBadRequest('Need drunk field')

        isDrunk = (drunk == 1) or (drunk == '1')
        last = self._getLastDrunk()

        if last and (last.drunk == isDrunk):
            status = 'drunk' if isDrunk else 'sober'
            return HttpResponseBadRequest('You are already %s' % (status))

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

    def _getLastDrunk(self):
        last = Drunks.GetLastDrunk()

        if last and last.drunk:
            currTime = datetime.datetime.now()
            drunkTime = last.time

            diff = currTime - drunkTime
            hours = diff.total_seconds() / Drunk.SECONDS_PER_HOUR

            if hours > Drunk.DRUNK_TIMEOUT:
                soberTime = drunkTime + datetime.timedelta(hours=Drunk.DRUNK_TIMEOUT)

                last = Drunks(time=soberTime, drunk=False)
                last.put()

        return last

    def _convertEpoch(self, time):
        return datetime.datetime.fromtimestamp(float(time) / 1000.0)
