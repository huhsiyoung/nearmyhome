package site.nearmyhome.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import site.nearmyhome.entity.Place;

import java.util.List;

public interface PlaceRepository extends JpaRepository<Place, Integer> {

    List<Place> findByDistrict(String dist);
}
