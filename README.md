# ITSS-Nihon1
# CafeFinder Project

Hệ thống tìm kiếm, quản lý thực đơn và đánh giá quán Cafe dành cho người dùng tại khu vực Bách Khoa.

## 🛠 Công nghệ sử dụng
* **Frontend:** HTML, CSS, JavaScript, Thymeleaf
* **Backend:** Java Spring Boot
* **Database:** PostgreSQL

---

## ⚙️ 1. Chuẩn bị Database

Trước khi chạy ứng dụng, bạn cần thiết lập cơ sở dữ liệu PostgreSQL:

1.  **Tạo database trống:**
    Mở terminal hoặc pgAdmin và tạo một database mới:
    ```bash
    createdb -U postgres itss_database
    ```

2.  **Khôi phục dữ liệu từ file SQL:**
    Sử dụng lệnh `psql` để thực thi file script (lưu ý tên file có khoảng trắng cần đặt trong dấu ngoặc kép):
    ```bash
    psql -U postgres -d itss_database -f "itss_db 1.sql"
    ```
    *Lưu ý: File SQL này bao gồm việc khởi tạo các kiểu dữ liệu ENUM, bảng, dữ liệu mẫu và Trigger tự động cập nhật điểm đánh giá (rating).*

---

## 📄 2. Cấu hình Ứng dụng

Chỉnh sửa thông tin kết nối trong file `src/main/resources/application.properties`:

```properties
spring.application.name=CafeFinderBackend

# Cấu hình kết nối Database
spring.datasource.url=jdbc:postgresql://localhost:5432/itss_database_name
spring.datasource.username=your_username
spring.datasource.password=your_password

# Cấu hình JPA/Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

 ## 🚀 3. Chạy Project
Ứng dụng sử dụng Thymeleaf làm template engine nên Frontend và Backend sẽ khởi chạy cùng nhau trên một server.

Cách 1 (Terminal):
Bash
```bash
./mvnw spring-boot:run
```
Cách 2 (IDE): Mở project trong IntelliJ IDEA hoặc Eclipse và chạy class có gắn annotation @SpringBootApplication.
Sau khi khởi động thành công, truy cập: http://localhost:8080
