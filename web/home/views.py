import os

from django.shortcuts import render_to_response
from django.views.generic import View

NAME = 'Anton'

class Home(View):

    def get(self, request, *args, **kwargs):
        url = self._formUrl()

        return render_to_response('home.html',
            {
                'url': url,
                'name': NAME,
                'version': os.environ['CURRENT_VERSION_ID']
            });

    def _formUrl(self):
        proto = self._getEnv('wsgi.url_scheme')
        host = self._getEnv('HTTP_HOST')
        uri = self._getEnv('PATH_INFO')

        if proto and host and uri:
            return  '%s://%s%s' % (proto, host, uri)

        return None

    def _getEnv(self, env):
        try:
            return os.environ[env]
        except KeyError:
            return None
