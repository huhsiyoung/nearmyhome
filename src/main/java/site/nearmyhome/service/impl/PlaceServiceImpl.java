package site.nearmyhome.service.impl;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import site.nearmyhome.entity.Place;
import site.nearmyhome.repository.PlaceRepository;
import site.nearmyhome.service.PlaceService;

import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class PlaceServiceImpl implements PlaceService {

    private final LocationServiceImpl locationService;

    private final PlaceRepository placeRepository;

    private final Double ONE_POINT_FIVE_KM = 1.5;

    public List<Place> searchPlace(Double lat, Double lon, String dist) {

        List<Place> places = new ArrayList<>();

        List<String> districtList = locationService.getAdjacentDistrict(dist);

        for (String district : districtList) {
            places.addAll(placeRepository.findByDistrict(district));
        }

        List<Place> placesWithinDistance = locationService.areAllPlacesWithinDistance(
                lat, lon, places, ONE_POINT_FIVE_KM
        );

        return placesWithinDistance;
    }
}
