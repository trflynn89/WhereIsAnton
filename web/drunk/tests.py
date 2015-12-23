import requests

drunk = {
    'drunk': '1',
}

sober = {
    'drunk': '0',
}

r = requests.post('http://localhost:8080/drunk/', data=drunk)
print r.status_code
