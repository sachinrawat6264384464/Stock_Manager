from django.contrib import admin
from .models import Product, ProductSize, StockIn, Bill, BillItem, Activity

class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1

class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'school', 'category', 'price')
    inlines = [ProductSizeInline]

class StockInAdmin(admin.ModelAdmin):
    list_display = ('product_size', 'quantity', 'date')

class BillItemInline(admin.TabularInline):
    model = BillItem
    readonly_fields = ('product_name', 'size', 'quantity', 'price', 'subtotal')
    extra = 0

class BillAdmin(admin.ModelAdmin):
    list_display = ('bill_number', 'customer_name', 'total_amount', 'date')
    inlines = [BillItemInline]

admin.site.register(Product, ProductAdmin)
admin.site.register(ProductSize)
admin.site.register(StockIn, StockInAdmin)
admin.site.register(Bill, BillAdmin)
admin.site.register(Activity)
