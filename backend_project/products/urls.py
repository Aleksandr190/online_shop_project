from django.urls import path
from .views import ProductListView, SiteSettingsView

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list-create'),
    path('settings/', SiteSettingsView.as_view(), name='site-settings'),
]