from rest_framework import serializers
from .models import Product, ProductSize, StockIn, Bill, BillItem, Activity

class ProductSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSize
        fields = ['id', 'size', 'price', 'quantity', 'low_stock_threshold']

class ProductSerializer(serializers.ModelSerializer):
    sizes = ProductSizeSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'school', 'category', 'price', 'image', 'sizes']

class StockInSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockIn
        fields = '__all__'

class BillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillItem
        fields = ['id', 'product_name', 'size', 'quantity', 'price', 'subtotal']

class BillSerializer(serializers.ModelSerializer):
    items = BillItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Bill
        fields = ['id', 'bill_number', 'customer_name', 'customer_phone', 'date', 'total_amount', 'items']

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'
