package com.itss.cafe_finder.repository;

import com.itss.cafe_finder.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email); // Dùng email để đăng nhập
}