from rest_framework import viewsets, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate
from django.http import JsonResponse
import json
from django.db import transaction
from django.utils import timezone
from .models import Product, ProductSize, StockIn, Bill, BillItem, Activity
from .serializers import (ProductSerializer, ProductSizeSerializer, StockInSerializer, 
                          BillSerializer, ActivitySerializer)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            user = authenticate(username=username, password=password)
            if user:
                return JsonResponse({'status': 'success', 'username': user.username, 'is_superuser': user.is_superuser})
            else:
                return JsonResponse({'error': 'Invalid credentials'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

class DashboardStatsView(APIView):
    def get(self, request):
        total_products = Product.objects.count()
        total_stock = sum(size.quantity for size in ProductSize.objects.all())
        
        today = timezone.now().date()
        today_sales = sum(bill.total_amount for bill in Bill.objects.filter(date__date=today))
        
        from django.db.models import F
        low_stock_limit = 5 # Fallback
        low_stock_items = ProductSize.objects.filter(quantity__lte=F('low_stock_threshold')).values(
            'id', 'product__name', 'size', 'quantity', 'product__school', 'low_stock_threshold', 'product__id'
        )
        
        recent_activities = ActivitySerializer(Activity.objects.all()[:10], many=True).data
        recent_bills = BillSerializer(Bill.objects.all().order_by('-date')[:10], many=True).data
        
        return Response({
            "total_products": total_products,
            "total_stock": total_stock,
            "today_sales": today_sales,
            "low_stock_items": low_stock_items,
            "recent_activities": recent_activities,
            "recent_bills": recent_bills
        })

class AnalyticsView(APIView):
    def get(self, request):
        today = timezone.now().date()
        
        # 1. Daily Sales (Last 7 Days)
        from datetime import timedelta
        last_7_days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
        daily_sales = []
        
        for day in last_7_days:
            sales = sum(bill.total_amount for bill in Bill.objects.filter(date__date=day))
            daily_sales.append({
                "date": day.strftime("%a"), # Mon, Tue, etc.
                "sales": sales
            })
            
        # 2. Monthly Sales (Current Year)
        current_year = today.year
        monthly_sales = []
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        for i, month_name in enumerate(months, 1):
            sales = sum(bill.total_amount for bill in Bill.objects.filter(date__year=current_year, date__month=i))
            monthly_sales.append({
                "month": month_name,
                "sales": sales
            })

        return Response({
            "daily_sales": daily_sales,
            "monthly_sales": monthly_sales
        })

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    @action(detail=True, methods=['post'])
    def add_size(self, request, pk=None):
        product = self.get_object()
        size = request.data.get('size')
        quantity = request.data.get('quantity', 0)
        low_stock_threshold = request.data.get('low_stock_threshold', 5)
        
        if not size:
            return Response({"error": "Size is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            product_size, created = ProductSize.objects.get_or_create(product=product, size=size)
            if not created:
                return Response({"error": "Size already exists"}, status=status.HTTP_400_BAD_REQUEST)
            
            product_size.quantity = quantity
            product_size.low_stock_threshold = low_stock_threshold
            product_size.save()
            
            Activity.objects.create(
                action_type='STOCK_IN',
                description=f"Added size {size} to {product.name} (Initial Qty: {quantity})"
            )
            return Response(ProductSizeSerializer(product_size).data)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StockInView(APIView):
    def post(self, request):
        product_size_id = request.data.get('product_size')
        quantity = int(request.data.get('quantity', 0))
        supplier = request.data.get('supplier', '')
        
        try:
            with transaction.atomic():
                product_size = ProductSize.objects.get(id=product_size_id)
                
                # Create StockIn record
                StockIn.objects.create(
                    product_size=product_size,
                    quantity=quantity,
                    supplier=supplier
                )
                
                # Update Inventory
                product_size.quantity += quantity
                product_size.save()
                
                # Log Activity
                # Log Activity
                desc = f"Added {quantity} stock to {product_size.product.name} ({product_size.size})"
                if supplier:
                    desc += f" from {supplier}"
                
                Activity.objects.create(
                    action_type='STOCK_IN',
                    description=desc
                )
                
                return Response({'status': 'success', 'new_quantity': product_size.quantity})
        except ProductSize.DoesNotExist:
            return Response({'error': 'Product size not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class BillViewSet(viewsets.ModelViewSet):
    queryset = Bill.objects.all().order_by('-date')
    serializer_class = BillSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        items = data.get('items', [])
        customer_name = data.get('customer_name', 'Guest')
        customer_phone = data.get('customer_phone', '')
        
        if not items:
            return Response({'error': 'No items in bill'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                total_amount = 0
                bill = Bill.objects.create(customer_name=customer_name, customer_phone=customer_phone)
                
                for item in items:
                    product_size_id = item.get('product_size_id')
                    qty = int(item.get('quantity'))
                    
                    product_size = ProductSize.objects.select_for_update().get(id=product_size_id)
                    
                    if product_size.quantity < qty:
                        raise ValueError(f"Insufficient stock for {product_size.product.name} ({product_size.size})")
                    
                    # Deduct Stock
                    product_size.quantity -= qty
                    product_size.save()
                    
                    price = product_size.product.price
                    subtotal = price * qty
                    total_amount += subtotal
                    
                    BillItem.objects.create(
                        bill=bill,
                        product_name=product_size.product.name,
                        size=product_size.size,
                        quantity=qty,
                        price=price
                    )
                
                bill.total_amount = total_amount
                bill.save()
                
                Activity.objects.create(
                    action_type='SALE',
                    description=f"Bill Generated: {bill.bill_number} for ₹{total_amount}"
                )
                
                return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)
                
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        try:
            with transaction.atomic():
                # Restore Stock
                for item in instance.items.all():
                    try:
                        # Try to find the product size to restore stock
                        # Note: We match by name and size since the original product might have been modified
                        # But ideally we should have kept the product_size_id in the BillItem
                        # Checking if we have a way to match it reliably
                        # Looking at BillItem creation in views.py, it uses product_size.id which is not stored in BillItem model
                        # Let's check BillItem model again.
                        
                        # Wait, I see BillItem has price, quantity, size, product_name.
                        # I'll try to find the ProductSize by product name and size.
                        product = Product.objects.filter(name=item.product_name).first()
                        if product:
                            ps = ProductSize.objects.filter(product=product, size=item.size).first()
                            if ps:
                                ps.quantity += item.quantity
                                ps.save()
                    except Exception as e:
                        print(f"Error restoring stock for item {item.id}: {str(e)}")
                        # Continue with other items
                
                # Log Activity
                Activity.objects.create(
                    action_type='DELETE',
                    description=f"Bill Deleted: {instance.bill_number} for ₹{instance.total_amount}"
                )
                
                return super().destroy(request, *args, **kwargs)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
