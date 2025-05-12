package site.nearmyhome.service;

import site.nearmyhome.entity.Place;

import java.util.List;

public interface LocationService {

    List<String> getAdjacentDistrict(String dist);

    List<Place> areAllPlacesWithinDistance(Double lat, Double lon, List<Place> places, Double maxDistanceKm);
}
