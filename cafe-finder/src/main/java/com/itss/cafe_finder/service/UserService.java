package com.itss.cafe_finder.service;

import com.itss.cafe_finder.model.User;
import com.itss.cafe_finder.model.enums.UserRoleType;
import com.itss.cafe_finder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Logic đăng ký user mới
    public void registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Mã hóa pass
        user.setRoleType(UserRoleType.customer); // Mặc định là customer
        userRepository.save(user);
    }

    // Logic lấy user cho Spring Security kiểm tra đăng nhập
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRoleType().name()))
        );
    }
}