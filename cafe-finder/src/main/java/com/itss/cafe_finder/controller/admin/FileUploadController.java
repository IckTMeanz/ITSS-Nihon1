package com.itss.cafe_finder.controller.admin;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Controller
public class FileUploadController {

    // Lưu vào thư mục static/images của project
    // Lưu ý: Khi chạy local, file lưu vào src có thể cần rebuild hoặc restart để target cập nhật
    private static final String UPLOAD_DIR = "cafe-finder/src/main/resources/static/images/";

    // Lưu thêm vào target để có thể thấy ảnh ngay lập tức (Hot reload giả lập)
    private static final String TARGET_UPLOAD_DIR = "cafe-finder/target/classes/static/images/";

    @PostMapping("/api/upload")
    @ResponseBody
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file");
        }

        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            
            // 1. Lưu vào thư mục source (để persist)
            saveFile(file, UPLOAD_DIR, fileName);
            
            // 2. Lưu vào thư mục target (để hiện ngay)
            try {
                saveFile(file, TARGET_UPLOAD_DIR, fileName);
            } catch (IOException e) {
                // Bỏ qua nếu không tìm thấy target
            }

            // Trả về tên file để lưu vào DB (frontend sẽ tự thêm /images/ khi hiển thị)
            return ResponseEntity.ok(fileName);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    private void saveFile(MultipartFile file, String dir, String fileName) throws IOException {
        Path uploadPath = Paths.get(dir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
    }
}
