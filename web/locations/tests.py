import requests

australia = {
    'address': 'Sydney, NSW, Australia',
    'latitude': -34.397,
    'longitude': 150.644
}

boston = {
    'address': 'Boston, MA, USA',
    'latitude': 42.3601,
    'longitude': -71.0589
}

r = requests.post('http://localhost:8080/locations/', data=boston)
print r.status_code
