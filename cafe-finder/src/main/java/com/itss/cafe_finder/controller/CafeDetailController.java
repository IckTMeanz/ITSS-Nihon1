package com.itss.cafe_finder.controller;

import dto.CafeDTO;
import dto.DishDTO;
import dto.ReviewDTO;
import com.itss.cafe_finder.model.User;
import com.itss.cafe_finder.service.CafeDetailService;
import com.itss.cafe_finder.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/cafes")
public class CafeDetailController {
    
    private static final Logger logger = LoggerFactory.getLogger(CafeDetailController.class);

    @Autowired
    private CafeDetailService cafeDetailService;
    
    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{id}")
    public String getCafeDetailPage(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) Integer star,
            Model model, 
            HttpSession session) {
        logger.info("Accessing cafe detail page: {}", id);
        
        CafeDTO cafe = cafeDetailService.getCafeDetail(id);
        List<DishDTO> dishes = cafeDetailService.getDishes(id);
        Page<ReviewDTO> reviews = cafeDetailService.getReviews(id, star, page, size);

        if (cafe == null) {
            logger.warn("Cafe not found: {}", id);
            return "error";
        }

        model.addAttribute("cafe", cafe);
        model.addAttribute("dishes", dishes != null ? dishes : List.of());
        model.addAttribute("reviews", reviews);
        
        // SessionInterceptor sẽ tự động add isLoggedIn vào model
        // Không cần thêm ở đây nữa

        return "details";
    }

    @GetMapping("/{id}/reviews-fragment")
    public String getReviewsFragment(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) Integer star,
            Model model) {
        
        Page<ReviewDTO> reviews = cafeDetailService.getReviews(id, star, page, size);
        model.addAttribute("reviews", reviews);
        return "details :: reviewList";
    }
    
    @PostMapping("/{id}/reviews")
    @ResponseBody
    public ResponseEntity<?> saveReview(@PathVariable Long id, 
                           @RequestParam("star") Integer star,
                           @RequestParam("content") String content) {
        
        logger.info("Saving review for cafe: {}", id);
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            logger.warn("User not logged in - redirecting to login");
            return ResponseEntity.status(401).body(Map.of("error", "User not logged in"));
        }
        
        String email = auth.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            logger.warn("User not found in database: {}", email);
            return ResponseEntity.status(401).body(Map.of("error", "User not found"));
        }
        
        logger.info("User found: {} ({})", user.getName(), user.getId());
        
        // Lưu review với user đang đăng nhập
        cafeDetailService.saveReview(id, user, star, content);
        
        logger.info("Review saved successfully");
        return ResponseEntity.ok(Map.of("message", "レビューを投稿しました。承認をお待ちください。"));
    }
}