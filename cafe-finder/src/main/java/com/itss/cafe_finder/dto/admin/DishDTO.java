package com.itss.cafe_finder.dto.admin;

import lombok.Data;

import java.math.BigDecimal;
import java.time.ZonedDateTime;

@Data
public class DishDTO {
    private Long id;
    private String name;
    private BigDecimal price;
    private String description;
    private String image;
    private ZonedDateTime updatedOn;
}

