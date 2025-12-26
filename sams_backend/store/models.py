from django.db import models
from django.utils import timezone

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('Blazer', 'Blazer'),
        ('Shirt', 'Shirt'),
        ('Pant', 'Pant'),
        ('Skirt', 'Skirt'),
        ('Other', 'Other'),
    ]
    
    name = models.CharField(max_length=200)
    school = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.school} - {self.name}"

class ProductSize(models.Model):
    product = models.ForeignKey(Product, related_name='sizes', on_delete=models.CASCADE)
    size = models.CharField(max_length=20)
    quantity = models.PositiveIntegerField(default=0)
    low_stock_threshold = models.PositiveIntegerField(default=5)

    class Meta:
        unique_together = ('product', 'size')

    def __str__(self):
        return f"{self.product.name} ({self.size})"

class StockIn(models.Model):
    product_size = models.ForeignKey(ProductSize, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    supplier = models.CharField(max_length=200, blank=True, null=True)
    date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.product_size} +{self.quantity}"

class Bill(models.Model):
    bill_number = models.CharField(max_length=20, unique=True, blank=True)
    customer_name = models.CharField(max_length=200, blank=True, null=True)
    customer_phone = models.CharField(max_length=15, blank=True, null=True)
    date = models.DateTimeField(default=timezone.now)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        if not self.bill_number:
            last_bill = Bill.objects.all().order_by('id').last()
            if last_bill:
                new_id = last_bill.id + 1
            else:
                new_id = 1
            self.bill_number = f"BILL-{new_id:05d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.bill_number

class BillItem(models.Model):
    bill = models.ForeignKey(Bill, related_name='items', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=200) # Deoupled in case product is deleted
    size = models.CharField(max_length=20)
    quantity = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price
        super().save(*args, **kwargs)

class Activity(models.Model):
    ACTION_TYPES = [
        ('STOCK_IN', 'Stock In'),
        ('SALE', 'Sale'),
        ('DELETE', 'Delete'),
        ('BILLING', 'Billing'),
    ]
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
