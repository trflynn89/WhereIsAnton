import collections
import json
import numpy
import requests

from dateutil import parser
from dateutil import relativedelta

class DrunkData(object):
    DRUNK_URL = 'http://wheresanton.com/drunk/'

    def __init__(self):
        response = requests.get(DrunkData.DRUNK_URL)
        data = json.loads(response.content)

        self._data = sorted(data['data'], key=lambda d: d['time'])

    def __iter__(self):
        start = None

        for drunk in self._data:
            if drunk['drunk']:
                start = parser.parse(drunk['time'])

            elif start:
                end = parser.parse(drunk['time'])
                delta = relativedelta.relativedelta(end, start)

                if delta.hours > 0:
                    yield [start, end, delta]

                start = None

class DrunkStats(object):
    def __init__(self):
        self._data = DrunkData()

    def calc_hours_drunk(self):
        drunkTimes = list()

        for [_, _, delta] in self._data:
            hours = delta.hours + (delta.minutes / 60.0)
            drunkTimes.append(hours)

        return [
            numpy.sum(drunkTimes),
            numpy.average(drunkTimes),
            numpy.median(drunkTimes)
        ]

    def calc_times_drunk_per_month(self):
        drunkCounts = collections.defaultdict(int)

        for [start, _, _] in self._data:
            key = '%d_%d' % (start.year, start.month)
            drunkCounts[key] += 1

        counts = drunkCounts.values()

        return [
            numpy.sum(counts),
            numpy.average(counts),
            numpy.median(counts)
        ]

def main():
    stats = DrunkStats()

    [total, average, median] = stats.calc_hours_drunk()
    print ('Has been drunk for %.2f hours. On average, gets drunk for %.2f '
        'hours (median %.2f hours).' % (total, average, median))

    [total, average, median] = stats.calc_times_drunk_per_month()
    print ('Has gotten drunk %d times. On average, gets drunk %.2f times per '
        'month (median %.2f times).' % (total, average, median))

if __name__ == '__main__':
    main()
