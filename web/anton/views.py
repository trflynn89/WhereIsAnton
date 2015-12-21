from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.generic import View


class Anton(View):

    def get(self, request, *args, **kwargs):
        return render_to_response('anton.html');
