# The 19 northern states plus FCT, one point per state (the state capital).
# NASA POWER data is about 50 km per grid cell, so one point per state is honest.

STATES = [
    {"id": "kano", "name": "Kano", "lat": 12.00, "lon": 8.52},
    {"id": "kaduna", "name": "Kaduna", "lat": 10.52, "lon": 7.44},
    {"id": "katsina", "name": "Katsina", "lat": 12.99, "lon": 7.60},
    {"id": "sokoto", "name": "Sokoto", "lat": 13.06, "lon": 5.24},
    {"id": "zamfara", "name": "Zamfara", "lat": 12.16, "lon": 6.66},
    {"id": "kebbi", "name": "Kebbi", "lat": 12.45, "lon": 4.20},
    {"id": "jigawa", "name": "Jigawa", "lat": 11.76, "lon": 9.34},
    {"id": "bauchi", "name": "Bauchi", "lat": 10.31, "lon": 9.84},
    {"id": "gombe", "name": "Gombe", "lat": 10.29, "lon": 11.17},
    {"id": "yobe", "name": "Yobe", "lat": 11.75, "lon": 11.96},
    {"id": "borno", "name": "Borno", "lat": 11.85, "lon": 13.16},
    {"id": "adamawa", "name": "Adamawa", "lat": 9.21, "lon": 12.48},
    {"id": "taraba", "name": "Taraba", "lat": 8.89, "lon": 11.36},
    {"id": "plateau", "name": "Plateau", "lat": 9.90, "lon": 8.86},
    {"id": "nasarawa", "name": "Nasarawa", "lat": 8.49, "lon": 8.52},
    {"id": "benue", "name": "Benue", "lat": 7.73, "lon": 8.54},
    {"id": "kogi", "name": "Kogi", "lat": 7.80, "lon": 6.74},
    {"id": "kwara", "name": "Kwara", "lat": 8.50, "lon": 4.55},
    {"id": "niger", "name": "Niger", "lat": 9.61, "lon": 6.56},
    {"id": "fct", "name": "FCT Abuja", "lat": 9.06, "lon": 7.49},
]

STATES_BY_ID = {s["id"]: s for s in STATES}
