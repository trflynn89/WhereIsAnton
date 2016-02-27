import json

from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.views.generic import View

class Update(View):

    VERSION_URL = 'http://where-is-anton.com/static/WhereIsAnton-%s.apk'
    CURRENT_VERSION = "none"

    def get(self, request):
        return HttpResponse(
            json.dumps({ 'version': Update.CURRENT_VERSION }),
            content_type='application/json')

    def post(self, request, *args, **kwargs):
        version = request.POST.get('version')

        if not version:
            return HttpResponseBadRequest('Need version')

        url = Update.VERSION_URL % (version)

        return HttpResponse(
            json.dumps({ 'version': Update.CURRENT_VERSION, 'url': url }),
            content_type='application/json')
