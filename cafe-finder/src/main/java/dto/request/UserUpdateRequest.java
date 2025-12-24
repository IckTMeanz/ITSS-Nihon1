package dto.request;

import java.time.LocalDate;

import lombok.Data;

@Data
public class UserUpdateRequest {

    private String name;

    private LocalDate dob;

}