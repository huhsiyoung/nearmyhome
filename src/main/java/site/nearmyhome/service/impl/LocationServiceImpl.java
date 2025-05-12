package site.nearmyhome.service.impl;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import site.nearmyhome.entity.Place;
import site.nearmyhome.service.LocationService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@AllArgsConstructor
public class LocationServiceImpl implements LocationService {

    private static final Double EARTH_RADIUS = 6378.137;

    private static final Map<String, List<String>> adjacentDistricts = Map.ofEntries(
            Map.entry("강서구", List.of("강서구", "양천구", "은평구")),
            Map.entry("마포구", List.of("마포구", "서대문구", "은평구", "용산구")),
            Map.entry("양천구", List.of("양천구", "강서구", "구로구", "영등포구")),
            Map.entry("은평구", List.of("은평구", "마포구", "서대문구", "종로구")),
            Map.entry("종로구", List.of("종로구", "은평구", "서대문구", "중구", "성북구")),
            Map.entry("서대문구", List.of("서대문구", "마포구", "은평구", "종로구", "중구")),
            Map.entry("구로구", List.of("구로구", "양천구", "영등포구", "금천구")),
            Map.entry("영등포구", List.of("영등포구", "마포구", "양천구", "구로구", "동작구")),
            Map.entry("금천구", List.of("금천구", "구로구", "관악구")),
            Map.entry("관악구", List.of("관악구", "금천구", "동작구", "서초구")),
            Map.entry("동작구", List.of("동작구", "영등포구", "관악구", "서초구", "용산구")),
            Map.entry("서초구", List.of("서초구", "관악구", "동작구", "강남구")),
            Map.entry("강남구", List.of("강남구", "서초구", "송파구")),
            Map.entry("송파구", List.of("송파구", "강남구", "강동구")),
            Map.entry("강동구", List.of("강동구", "송파구", "하남시")),
            Map.entry("용산구", List.of("용산구", "동작구", "서초구", "강남구", "중구", "성동구")),
            Map.entry("성동구", List.of("성동구", "강남구", "용산구", "중구", "동대문구", "광진구")),
            Map.entry("중구", List.of("중구", "종로구", "서대문구", "용산구", "성동구", "동대문구")),
            Map.entry("동대문구", List.of("동대문구", "중구", "성동구", "광진구", "중랑구")),
            Map.entry("광진구", List.of("광진구", "강남구", "성동구", "동대문구", "중랑구")),
            Map.entry("중랑구", List.of("중랑구", "동대문구", "광진구", "노원구")),
            Map.entry("노원구", List.of("노원구", "중랑구", "도봉구", "강북구")),
            Map.entry("도봉구", List.of("도봉구", "노원구", "강북구")),
            Map.entry("강북구", List.of("강북구", "도봉구", "노원구", "성북구")),
            Map.entry("성북구", List.of("성북구", "강북구", "종로구", "동대문구", "노원구"))
    );

    @Override
    public List<String> getAdjacentDistrict(String dist) {

        List<String> adjacentDistrictList = adjacentDistricts.getOrDefault(dist, null);

        if (adjacentDistrictList == null) {
            throw new IllegalArgumentException();
        }

        return adjacentDistrictList;
    }

    @Override
    public List<Place> areAllPlacesWithinDistance(Double lat, Double lon, List<Place> places, Double maxDistanceKm) {

        List<Place> placesWithin1km = new ArrayList<>();

        double startLatRadian = Math.toRadians(lat);
        double startLonRadian = Math.toRadians(lon);

        for (Place place : places) {
            double centralAngle = getCentralAngle(place, startLatRadian, startLonRadian);

            double distance = EARTH_RADIUS * centralAngle;

            if (distance < maxDistanceKm) {
                placesWithin1km.add(place);
            }
        }

        return placesWithin1km;
    }

    private static double getCentralAngle(Place place, double startLatRadian, double startLonRadian) {

        double endLatRadian = Math.toRadians(place.getLatitude());
        double endLonRadian = Math.toRadians(place.getLongitude());

        double latDiff = endLatRadian - startLatRadian;
        double lonDiff = endLonRadian - startLonRadian;

        double haversineValue = Math.pow(Math.sin(latDiff / 2), 2)
                + Math.cos(startLatRadian) * Math.cos(endLatRadian) * Math.pow(Math.sin(lonDiff / 2), 2);

        return 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));
    }
}
