package com.odessi.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class MergeCartRequest {
    @NotNull
    @Valid
    private List<AddCartItemRequest> items;

    public List<AddCartItemRequest> getItems() { return items; }
    public void setItems(List<AddCartItemRequest> items) { this.items = items; }
}
