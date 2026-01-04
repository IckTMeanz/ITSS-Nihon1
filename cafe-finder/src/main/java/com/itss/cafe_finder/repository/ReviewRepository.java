package com.itss.cafe_finder.repository;

import com.itss.cafe_finder.model.Review;
import com.itss.cafe_finder.model.enums.ReviewStatusType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByStatus(ReviewStatusType status, Pageable pageable);

    @Query("SELECT r FROM Review r WHERE r.content LIKE %:keyword% OR r.user.name LIKE %:keyword%")
    Page<Review> findByContentContainingOrUserNameContaining(
            @Param("keyword") String keyword, Pageable pageable);

    Page<Review> findByContentContainingIgnoreCase(String keyword, Pageable pageable);

    Page<Review> findByStatusAndStar(
            ReviewStatusType status, Integer star, Pageable pageable);

    long countByStatus(ReviewStatusType status);

    List<Review> findByCafeId(Long cafeId);
    List<Review> findByCafeIdAndStatus(Long cafeId, ReviewStatusType status);

    Page<Review> findByCafeId(Long cafeId, Pageable pageable);
    Page<Review> findByCafeIdAndStatus(Long cafeId, ReviewStatusType status, Pageable pageable);

    Page<Review> findByCafeIdAndStar(Long cafeId, Integer star, Pageable pageable);
    Page<Review> findByCafeIdAndStatusAndStar(Long cafeId, ReviewStatusType status, Integer star, Pageable pageable);
}