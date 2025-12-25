from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, BillViewSet, ActivityViewSet, DashboardStatsView, StockInView, login_view, AnalyticsView

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'bills', BillViewSet)
router.register(r'activities', ActivityViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('auth/login/', login_view, name='login'),
    path('stock/in/', StockInView.as_view(), name='stock-in'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
]
