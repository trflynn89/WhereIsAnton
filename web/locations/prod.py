import requests

HOST = 'http://wheresanton.com/locations/'

ADDRS = [
   {
        'address': 'Somerville, MA',
        'latitude': 42.39933824,
        'longitude': -71.12802755,
        'date': '2015-03-12'
    },
    {
        'address': 'The Bahamas',
        'latitude': 25.0845025,
        'longitude':  -77.31942523,
        'date': '2016-1-2'
    },
]

def main():
    for addr in ADDRS:
        response = requests.post(HOST, data=addr)
        print addr['address']

        if response.status_code != 200:
            print response.content
            break

if __name__ == '__main__':
    main()
