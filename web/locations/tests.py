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

r = requests.post('http://localhost:8080/locations/', data=quincy)
print r.status_code
print r.content
