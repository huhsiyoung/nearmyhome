package site.nearmyhome.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import site.nearmyhome.entity.Place;
import site.nearmyhome.service.impl.PlaceServiceImpl;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class SearchController {

    private final PlaceServiceImpl placeService;

    @GetMapping()
    public String showMapSearchPage() {
        return "map-search";
    }

    @ResponseBody
    @GetMapping("/search")
    public List<Place> search(
            @RequestParam("latitude") Double lat,
            @RequestParam("longitude") Double lon,
            @RequestParam("district") String dist) {
        try {
            List<Place> result = placeService.searchPlace(lat, lon, dist);

            return result;
        } catch (Exception e) {
            e.printStackTrace();

            return List.of();
        }
    }
}
