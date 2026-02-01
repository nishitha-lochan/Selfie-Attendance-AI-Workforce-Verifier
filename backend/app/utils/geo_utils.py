from geopy.distance import geodesic

def is_within_radius(user_lat, user_lon, office_lat, office_lon, radius_km=0.1):
    """
    Check if user is within radius_km of office.
    Default radius 100 meters (0.1 km).
    """
    user_loc = (user_lat, user_lon)
    office_loc = (office_lat, office_lon)
    
    distance = geodesic(user_loc, office_loc).km
    return distance <= radius_km, distance
