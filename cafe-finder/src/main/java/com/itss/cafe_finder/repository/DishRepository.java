package com.itss.cafe_finder.repository;

import com.itss.cafe_finder.model.Dish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DishRepository extends JpaRepository<Dish, Long> {
    List<Dish> findByCafeId(Long cafeId);
    void deleteByCafeId(Long cafeId);
}

