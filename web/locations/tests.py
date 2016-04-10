import requests

australia = {
    'address': 'Sydney, NSW, Australia',
    'latitude': -34.397,
    'longitude': 150.644
}

boston = {
    'address': 'Boston, MA',
    'latitude': 42.3601,
    'longitude': -71.0589
}

quincy = {
    'address': 'Quincy, MA',
    'latitude': 42.2500,
    'longitude': -71.0000
}

addrs = [
   {
        'address': 'Somerville, MA',
        'latitude': 42.39933824,
        'longitude': -71.12802755
    },
    {
        'address': 'The Bahamas',
        'latitude': 25.0845025,
        'longitude':  -77.31942523
    },
    {
        'address': 'Boston, MA',
        'latitude': 42.36743234,
        'longitude': -71.01498765
    },
    {
        'address': 'North Providence, RI',
        'latitude': 41.8695405,
        'longitude':  -71.42164457
    },
    {
        'address': 'Medford, MA',
        'latitude': 42.40329382,
        'longitude': -71.11086035
    },
    {
        'address': 'Queens, NY',
        'latitude': 40.77438124,
        'longitude': -73.8674566
    },
    {
        'address': 'Moon, PA',
        'latitude': 40.49529691,
        'longitude': -80.24453489
    },
    {
        'address': 'Philadelphia, PA',
        'latitude': 39.87428749,
        'longitude': -75.24398815
    },
    {
        'address': 'Somerville, MA',
        'latitude': 42.39933536,
        'longitude': -71.12735663
    },
    {
        'address': 'Oslo, Norway',
        'latitude': 59.90843387,
        'longitude': 10.76183604
    },
    {
        'address': 'Jamaica, NY',
        'latitude': 40.64337053,
        'longitude': -73.78920629
    },
    {
        'address': 'Somerville, MA',
        'latitude': 42.39957445,
        'longitude': -71.12785133
    },
    {
        'address': 'Marina del Rey, CA',
        'latitude': 33.9915511,
        'longitude':  -118.44635092
    },
    {
        'address': 'Boston, MA',
        'latitude': 42.36401675,
        'longitude': -71.01866548
    },
    {
        'address': 'Bangor, PA',
        'latitude': 40.84930987,
        'longitude': -75.13609391
    },
    {
        'address': 'Cambridge, MA',
        'latitude': 42.3926407,
        'longitude':  -71.1353822
    },
    {
        'address': 'Miami, FL',
        'latitude': 25.79826193,
        'longitude': -80.2734891
    },
    {
        'address': 'Cancun, Quintana Roo, Mexico',
        'latitude': 21.13936297,
        'longitude': -86.74912909
    },
    {
        'address': 'Boston, MA',
        'latitude': 42.3610788,
        'longitude':  -71.07188261
    },
    {
        'address': 'St. Louis, LA',
        'latitude': 38.74337126,
        'longitude': -90.3543807
    },
    {
        'address': 'Los Angeles, CA',
        'latitude': 33.94833773,
        'longitude': -118.41014352
    },
    {
        'address': 'Woburn, MA',
        'latitude': 42.4954668,
        'longitude':  -71.1286515
    },
    {
        'address': 'Chicago, IL',
        'latitude': 41.99823002,
        'longitude': -87.90304922
    },
    {
        'address': 'Dorchester, MA',
        'latitude': 42.3187829,
        'longitude':  -71.0543794
    },
    {
        'address': 'Bethlehem, PA',
        'latitude': 40.66638685,
        'longitude': -75.30970162
    },
    {
        'address': 'Somerville, MA',
        'latitude': 42.39926756,
        'longitude': -71.12785904
    },
    {
        'address': 'Chiyoda, Tokyo, JP',
        'latitude': 35.6977398,
        'longitude':  139.7541453
    },
    {
        'address': 'Benda, Banten, ID',
        'latitude': 6.1228482,
        'longitude':  106.6532964
    },
    {
        'address': 'Kuta, Bali, ID',
        'latitude': 8.7444302,
        'longitude':  115.1642558
    },
    {
        'address': 'Bang Phli District, Samut Prakan, TH',
        'latitude': 13.6920915,
        'longitude':  100.7508323
    },
    {
        'address': 'Beijing, CN',
        'latitude': 39.9042,
        'longitude': 116.4074
    },
    {
        'address': 'Medford, MA',
        'latitude': 42.4131342,
        'longitude':  -71.1213171
    }
]

#r = requests.post('http://localhost:8080/locations/', data=quincy)
#print r.status_code
#print r.content

for addr in addrs:
    r = requests.post('http://localhost:8080/locations/', data=addr)
    print r.status_code
