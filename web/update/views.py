import json
import os

from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.views.generic import View

class Update(View):

    VERSION_URL = '/static/%s/WhereIsAnton.apk'

    def get(self, request):
        version = Update.GetCurrentVersion()

        return HttpResponse(
            json.dumps({ 'version': version }),
            content_type='application/json')

    def post(self, request, *args, **kwargs):
        version = request.POST.get('version')

        if not version:
            return HttpResponseBadRequest('Need version')

        current = Update.GetCurrentVersion()
        url = None

        if current != version:
            url = Update.VERSION_URL % (current)

        return HttpResponse(
            json.dumps({ 'version': current, 'url': url }),
            content_type='application/json')

    @staticmethod
    def GetCurrentVersion():
        try:
            version = os.environ['CURRENT_VERSION_ID']
            version = version.split('.')[0]
        except KeyError:
            version = None

        return version
