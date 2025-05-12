package site.nearmyhome.service;

import site.nearmyhome.entity.Place;

import java.util.List;

public interface PlaceService {
    List<Place> searchPlace(Double lat, Double lon, String dist);
}
