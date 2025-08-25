import requests
import json
from   dotenv import load_dotenv
load_dotenv()
import os

weather_key = os.getenv("IQAIR_KEY")

# The base URL for the API endpoint
url = "http://api.airvisual.com/v2/city"

# The query parameters from your curl command
# Using a params dictionary is cleaner and safer than building the URL string by hand
params = {
    "city": "Bengaluru",
    "state": "Karnataka",
    "country": "India",
    "key": weather_key
}

try:
    # Make the GET request. The `requests` library follows redirects by default,
    # which is equivalent to curl's --location flag.
    response = requests.get(url, params=params)

    # Raise an HTTPError for bad responses (4xx or 5xx)
    response.raise_for_status()

    # Parse the JSON response into a Python dictionary
    weather_data = response.json()
    # Accessing keys from the dictionary
    city = weather_data['data']['city']
    temperature = weather_data['data']['current']['weather']['tp']
    air_quality_index = weather_data['data']['current']['pollution']['aqius']
    time = weather_data['data']['current']['pollution']['ts']

    # Print the accessed values
    print(f"City: {city}")
    print(f"Temperature: {temperature}°C")
    print(f"Air Quality Index (US): {air_quality_index}")
    print(f"Time: {time}")
    print("_" * 40)
    # Print the dictionary, pretty-printed with an indent of 2 spaces
    print(json.dumps(weather_data, indent=2))

except requests.exceptions.RequestException as e:
    print(f"An error occurred during the request: {e}")
import json

